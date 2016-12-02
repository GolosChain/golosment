const _ = require('lodash')
module.exports = function pushToSegment(analytics, timestamp, identity, event, properties){
  if (!timestamp || !identity || !identity.userId || !event) return;
  let userId = identity.userId;

  let identifyObject = Object.assign({/*timestamp: timestamp*/}, _.omit(identity, ['userId']))
  let trackObject = {
    userId: identity.userId,
    timestamp: timestamp,
    event: event,
    properties: properties
  }
  if (true) {
    analytics.identify({userId: userId, traits: identifyObject});
    analytics.track(trackObject);
  } else {
    if (event != "Block Signed" )console.log("ready to push;", identifyObject, trackObject)
  }
}
