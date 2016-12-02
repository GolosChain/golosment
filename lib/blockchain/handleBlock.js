const _ = require('lodash')
const OperationsMapTransform = require('./operationsMapTransform')
const pushToSegment = require ('../segment/pushToSegment')

function log10(str) {
    const leadingDigits = parseInt(str.substring(0, 4));
    const log = Math.log(leadingDigits) / Math.log(10)
    const n = str.length - 1;
    return n + (log - parseInt(log));
}

function repLog10 (rep2) {
    if(rep2 == null) return rep2
    let rep = String(rep2)
    const neg = rep.charAt(0) === '-'
    rep = neg ? rep.substring(1) : rep

    let out = log10(rep)
    if(isNaN(out)) out = 0
    out = Math.max(out - 9, 0); // @ -9, $0.50 earned is approx magnitude 1
    out = (neg ? -1 : 1) * out
    out = (out * 9) + 25 // 9 points per magnitude. center at 25
    // base-line 0 to darken and < 0 to auto hide (grep rephide)
    out = parseInt(out)
    return out
}

function getIdentityObject(accountData){
  return ret = {
    userId: accountData.name,
    created: new Date(accountData.created),
    post_count: accountData.post_count,
    last_vote_time: new Date(accountData.last_vote_time),
    balance: parseFloat(accountData.balance.split(' ')[0]) + parseFloat(accountData.savings_balance.split(' ')[0]),
    sbd_balance: parseFloat(accountData.sbd_balance.split(' ')[0]) + parseFloat(accountData.savings_sbd_balance.split(' ')[0]),
    vesting_shares: parseFloat(accountData.vesting_shares.split(' ')[0]),
    vesting_withdraw_rate: 100 * parseFloat(accountData.vesting_withdraw_rate.split(' ')[0]) /
    parseFloat(accountData.vesting_shares.split(' ')[0]),
    curation_rewards: accountData.curation_rewards,
    posting_rewards: accountData.posting_rewards,
    witnesses_voted_for: accountData.witnesses_voted_for,
    last_post: new Date(accountData.last_post),
    last_root_post: new Date(accountData.last_root_post),
    reputation: repLog10(accountData.reputation)
  }
}

module.exports = function handleBlock(Api, analytics, index){
  function parseDate(str){
    return new Date(Date.parse(str))
  }
  let i = index;
  Api.database_api().exec("get_block", [i]).then(block => {
    if (!(block && block.witness && block.timestamp)) return;
    let timestamp = parseDate(block.timestamp);
    if (true || !(index%500)) {
      console.log(`block #${i}, tx len: ${block.transactions.length}, timestamp: ${timestamp}, witness: ${block.witness}` )
    }
    Api.database_api().exec("get_accounts", [[block.witness]]).then(ret => {
      let m = getIdentityObject(ret[0]);
      pushToSegment(analytics, timestamp, m, "Block Signed", {
        previous: block.previous,
        witness: block.witness,
        transaction_merkle_root: block.transaction_merkle_root,
        extensions: block.extensions,
        witness_signature: block.witness_signature,
        transactionsLength: block.transactions.length
      })
    })


    if (block.transactions.length) {
      _.each(block.transactions, function(transaction){
        _.each(transaction.operations, function(operation){
          if (OperationsMapTransform[operation[0]]) {
            let parsed = OperationsMapTransform[operation[0]](operation[1]);
            if (!parsed) {
              console.log('---')
              console.log("op", operation.length, operation[0], operation[1])
              console.log(' ')
              return;
            }
            if (parsed && parsed.event) {
              Api.database_api().exec("get_accounts", [[parsed.userId]]).then(ret => {
                let m = getIdentityObject(ret[0]);
                pushToSegment(analytics, timestamp, m, parsed.event, parsed.properties)
              });
            }
          } else {
            console.log('-')
            console.log("op", operation.length, operation[0], operation[1])
            console.log(' ')
          }
        })
      })
    }
  })
}
