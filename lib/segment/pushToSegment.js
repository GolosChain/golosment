module.exports = function pushToSegment(analytics, timestamp, identity, event, properties){
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
