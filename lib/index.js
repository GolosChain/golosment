const {Client} = require("steem-rpc");
const Analytics = require('analytics-node')
const _ = require('lodash')
const {analyticsWriteKey} = require('../config')
const options = {
    url: "wss://ws.golos.io",
}
const Api = Client.get( options, true);
const analytics = new Analytics(analyticsWriteKey)
const OperationsMapTransform = require('./operationsMapTransform')

function parseDate(str){
  return new Date(Date.parse(str))
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
