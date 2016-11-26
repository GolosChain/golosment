const {Client} = require("steem-rpc");
const Analytics = require('analytics-node')
const _ = require('lodash')
const {analyticsWriteKey} = require('./config')
const options = {
    url: "wss://ws.golos.io",
}
const Api = Client.get( options, true);
const analytics = new Analytics(analyticsWriteKey)

function parseDate(str){
  return new Date(Date.parse(str))
}

function dealCustomJson(opData){
  if (opData[0] == 'follow')
    return {
      event: 'Follow',
      userId: opData[1].follower,
      properties: _.omit( opData[1], ['follower'])
    }
  if (opData[0] == 'reblog')
    return {
      event: 'Reblog',
      userId: opData[1].account,
      properties: _.omit( opData[1], ['account'])
    }
  console.log(opData[0], opData[1])
  return null;
}

var OperationsMapTransform = {
  "account_create": function(opData){
    return !opData ? null :
    {
      event: "Account Create",
      userId: opData.creator,
      properties: _.omit(opData, ['creator', 'memo_key'])
    }
  },
  "account_update": function(opData){
    return !opData ? null : {
      event: "Account Update",
      userId: opData.account,
      properties: _.omit(opData, ['account'])
    }
  },
  "account_witness_proxy": function(opData){
    return !opData ? null :
    {
      event: "Witness proxy",
      userId: opData.account,
      props: _.omit(opData, ['account'])
    }
  },
  "account_witness_vote": function(opData){
    return !opData ? null :
    {
      event: "Witness vote",
      userId: opData.account,
      properties: _.omit(opData, ['account'])
    }
  },
  "comment": function(opData){
    return !opData ? null :
    {
      event: "Comment",
      userId: opData.author,
      properties: _.omit(opData, ['author', 'body'])
    }
  },
  "comment_options": function(opData){
    return !opData ? null : {
      event: "Commet Options",
      userId: opData.author,
      properties: _.omit(opData, ['author'])
    }
  },
  "custom_json": function(opData){
    if (!opData) return null;
    try {
      let jsp = JSON.parse(opData.json);
      let op = dealCustomJson(jsp)
      if (op && op.properties) {
        op.properties.operationNote = "Custom Json operation"
      }
      return op;
    } catch(e) {
      console.log('999')
      return null
    }

  },
  "delete_comment": function(opData){
    return !opData ? null : {
      event: "Delete Comment",
      userId: opData.author,
      properties: _.omit(opData, ['author'])
    }
  },
  "feed_publish": function(){
    return !opData ? null : {
      event: "Publish Feed",
      userId: opData.publisher,
      properties: _.omit(opData, ['publisher'])
    }
  },
  "pow2": function(){
    return {} //as no event property is returned, this will be ignored.
    // as positive value is returned, can pretend it s handled ok and not print it
  },
  "set_withdraw_vesting_route": function(){
    return !opData ? null :
    {
      event: "Set Withdraw Vesting Route",
      userId: opData.to_account,
      properties: opData
    }
  },
  "transfer": function(){
    return !opData ? null :
    {
      event: "Transfer",
      userId: opData.from,
      properties: _.omit(opData, ['from'])
    }
  },
  "transfer_to_vesting": function(){
    return !opData ? null :
    {
      event: "Transfer To Vesting",
      userId: opData.from,
      properties: _.omit(opData, ['from'])
    }
  },
  "vote": function(opData){
    return !opData ? null :
    {
      event: "Vote",
      userId: opData.voter,
      properties: _.omit(opData, ['voter'])
    }
  },
  "witness_update": function(opData){
    return !opData ? null :
    {
      event: "Witness Update",
      userId: opData.owner,
      properties: _.omit(opData, ['owner'])
    }
  },
  "withdraw_vesting": function(opData){
    return !opData ? null :
    {
      event: "Withdraw Vesting",
      userId: opData.account,
      properties: _.omit(opData, ['account'])
    }
  }
}


function pushToSegment(timestamp, identity, event, properties){

  // too strict?
  if (!timestamp || !identity || !identity.userId || !event) return;
  let identifyObject = Object.assign({}, identity, {
    timestamp: timestamp
  });
  let trackObject = {
    userId: identity.userId,
    timestamp: timestamp,
    event: event,
    properties: properties
  }
  if (true) {
    analytics.identify(identifyObject);
    analytics.track(trackObject);
  } else {
    if (event != "Block Signed" )console.log("ready to push;", identifyObject, trackObject)
  }
}

let Operations = new Set()

function dealWithBlock(index){
  let i = index;
  Api.database_api().exec("get_block", [i]).then(block => {
    if (!(block && block.witness && block.timestamp)) return;
    let timestamp = parseDate(block.timestamp);
    if (!(index%500)) {
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
      //console.log("block transactions:")
      //console.log()
      //console.log(block.transactions)
      //console.log()
      _.each(block.transactions, function(transaction){
        //console.log('tx properties: ', _.pick(transaction, ['ref_block_num','ref_block_prefix','expiration']));
        _.each(transaction.operations, function(operation){
          //console.log('opname: ', operation[0],"==")
          Operations.add(operation[0])
          if (OperationsMapTransform[operation[0]]) {
            //console.log('+')
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
    //console.log(' ');
  })
}

console.log(analyticsWriteKey)
const from=1
const to=1132000
Api.initPromise.then(response => {
	console.log("Api ready:", response);

	/*Api.database_api().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
    console.log("head block", response.head_block_number)
	})*/
  var idx = from
  let mainInterval = setInterval(function(){
    dealWithBlock(idx);
    idx++;
    if (idx>to) {
      clearInterval(mainInterval)
    }
  }, 10)

});
