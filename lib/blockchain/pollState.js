module.exports = function pollState(Api, callback){
  Api.database_api().exec("get_dynamic_global_properties", []).then(callback)
}
