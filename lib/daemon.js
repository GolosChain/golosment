const {wssUrl, analyticsWriteKey} = require('../config')
const options = {url: wssUrl || "wss://ws.golos.io"}
const {Client} = require("steem-rpc");
const Api = Client.get( options, true);

const Analytics = require('analytics-node')
const analytics = new Analytics(analyticsWriteKey, {
  //flushAt: 2,
  flushAfter: 3000
})

const pollState = require('./blockchain/pollState')
const handleBlock = require('./blockchain/handleBlock');

var lastBlock = null;


function cb1(response) {
  //console.log("get_dynamic_global_properties", response);
  if (lastBlock != response.head_block_number) {
    lastBlock = response.head_block_number;
    console.log(`new block #${lastBlock}`);
    handleBlock(Api, analytics, lastBlock)
  }
}

Api.initPromise.then(response => {
	console.log("Api ready:", response);
  let mainInterval = setInterval(function(){
    pollState(Api, cb1);
  }, 1000)
});
