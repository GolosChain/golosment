const {wssUrl, analyticsWriteKey} = require('../config')
const options = {url: wssUrl || "wss://ws.golos.io"}
const {Client} = require("steem-rpc");
const Api = Client.get( options, true);

const Analytics = require('analytics-node')
const analytics = new Analytics(analyticsWriteKey)

const handleBlock = require('./blockchain/handleBlock');
const from=1
const to=11

Api.initPromise.then(response => {
	console.log("Api ready:", response);
  var idx = from
  let mainInterval = setInterval(function(){
    handleBlock(Api, analytics, idx);
    idx++;
    if (idx>to) {
      clearInterval(mainInterval)
    }
  }, 10)
});
