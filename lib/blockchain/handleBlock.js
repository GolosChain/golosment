const _ = require('lodash')

const OperationsMapTransform = require('./operationsMapTransform')
const pushToSegment = require ('../segment/pushToSegment')

let Operations = new Set()

module.exports = function handleBlock(Api, index){
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
    pushToSegment(timestamp, {userId: block.witness}, "Block Signed", {
      previous: block.previous,
      witness: block.witness,
      transaction_merkle_root: block.transaction_merkle_root,
      extensions: block.extensions,
      witness_signature: block.witness_signature,
      transactionsLength: block.transactions.length
    })

    if (block.transactions.length) {
      _.each(block.transactions, function(transaction){
        _.each(transaction.operations, function(operation){
          Operations.add(operation[0])
          if (OperationsMapTransform[operation[0]]) {
            let parsed = OperationsMapTransform[operation[0]](operation[1]);
            if (!parsed) {
              console.log('---')
              console.log("op", operation.length, operation[0], operation[1])
              console.log(' ')
              return;
            }
            if (parsed && parsed.event) {
              pushToSegment(timestamp, {userId: parsed.userId}, parsed.event, parsed.properties)
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
