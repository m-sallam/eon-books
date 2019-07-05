var mongoose = require('mongoose')
var Schema = mongoose.Schema

var bookSchema = new Schema({
  title: String,
  author: [String],
  genre: [String],
  thumbnail: String,
  language: String,
  publishedDate: String,
  averageRating: Number,
  description: String,
  sentRequest: Boolean,
  date: Date,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
})
var bookModel = mongoose.model('Book', bookSchema)

module.exports = bookModel
