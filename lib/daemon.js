const {wssUrl} = require('../config')
const options = {url: wssUrl || "wss://ws.golos.io"}
const {Client} = require("steem-rpc");
const Api = Client.get( options, true);
const pollState = require('./blockchain/pollState')
const handleBlock = require('./blockchain/handleBlock');

var lastBlock = null;


function cb1(response) {
  console.log(response.head_block_number)
  //console.log("get_dynamic_global_properties", response);
  if (lastBlock != response.head_block_number) {
    lastBlock = response.head_block_number;
    console.log(`new block #${lastBlock}`);
    handleBlock(Api, lastBlock)
  }
}

Api.initPromise.then(response => {
	console.log("Api ready:", response);
  let mainInterval = setInterval(function(){
    pollState(Api, cb1);
  }, 1000)
});
