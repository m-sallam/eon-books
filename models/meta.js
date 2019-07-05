var mongoose = require('mongoose')
var Schema = mongoose.Schema

var metaSchema = new Schema({
  name: String,
  genres: [String],
  languages: [String]
})
var metaModel = mongoose.model('Meta', metaSchema)

module.exports = metaModel
