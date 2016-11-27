const _ = require('lodash')

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

const OperationsMapTransform = {
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

module.exports = OperationsMapTransform
