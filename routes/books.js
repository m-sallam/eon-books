var router = require('express').Router()
var request = require('request')
var middleware = require('../middleware')
var Book = require('../models/book')
var Meta = require('../models/meta')
var Request = require('../models/request')

router.route('/books')
  .get(function (req, res) {
    res.redirect('/books/1')
  })
  .post(middleware.isLoggedIn,
    function (req, res) {
      var newBook = new Book({
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        thumbnail: req.body.thumbnail,
        language: req.body.language,
        publishedDate: req.body.publishedDate,
        averageRating: req.body.averageRating,
        description: req.body.description,
        date: Date.now(),
        user: req.user
      })
      newBook.save(function (err, book) {
        if (err) {
          console.log(err)
        } else {
          console.log('new book saved to database : ', book.title)
        }
      })
      Meta
        .findOne({
          name: 'meta'
        }, function (err, meta) {
          if (err) {
            console.log(err)
          } else {
            for (var gen of req.body.genre) {
              if (meta.genres.indexOf(gen) === -1) {
                meta.genres.push(gen)
              }
            }
            if (meta.languages.indexOf(req.body.language) === -1) {
              meta.languages.push(req.body.language)
            }
            meta.save()
          }
        })
      res.end()
    })
  .delete(middleware.isLoggedIn,
    function (req, res) {
      Book
        .remove({
          _id: req.body.id
        }, function (err) {
          if (err) {
            console.log(err)
          } else {
            Request
              .remove({
                $and: [{
                  status: {
                    $ne: 'completed'
                  }
                }, {
                  $or: [{
                    senderBook: req.body.id
                  }, {
                    recieverBook: req.body.id
                  }]
                }]
              })
              .exec(function (err) {
                if (err) {
                  console.log(err)
                } else {
                  res.end()
                }
              })
          }
        })
    })

router.route('/addbooks')
  .get(middleware.isLoggedIn,
    function (req, res) {
      var bookName = req.query.bookname
      if (bookName) {
        var url = `https://www.googleapis.com/books/v1/volumes?q=${bookName}&maxResults=3&key=AIzaSyBhCDWa_59Ncnq-HbtSNstn68RKkOSPXQY`
        request(url, function (err, response, body) {
          if (err) {
            console.log(err)
          }
          var obj = JSON.parse(body)
          var volumes = []
          for (var item of obj.items) {
            var volumeInfo = item.volumeInfo
            var thumbnail = '/img/default-cover.jpg'
            if (volumeInfo.imageLinks) {
              thumbnail = volumeInfo.imageLinks.thumbnail.split('&')
              thumbnail[3] = 'zoom=2'
              thumbnail = thumbnail.join('&')
            }
            var subtitle = volumeInfo.subtitle ? ' - ' + volumeInfo.subtitle : ''
            var description = volumeInfo.description ? volumeInfo.description.substring(0, 200) + '....' : ''
            var volume = {
              title: volumeInfo.title.split('-')[0] + subtitle,
              author: volumeInfo.authors,
              genre: volumeInfo.categories,
              thumbnail: thumbnail,
              language: volumeInfo.language,
              publishedDate: volumeInfo.publishedDate,
              averageRating: volumeInfo.averageRating,
              description: description
            }
            volumes.push(volume)
          }

          res.json({
            volumes: volumes
          })
        })
      } else {
        res.end()
      }
    })

router.route('/bookinfo')
  .get(function (req, res) {
    if (req.query.id !== null) {
      Book.findById(req.query.id).populate('user').exec(function (err, book) {
        if (err) {
          console.log(err)
        } else {
          if (book) {
            res.render('partials/modal', {
              volume: book
            })
          } else {
            res.send('<h1> Something went wrong, please try again or contact someone... not me anyone else.</h1>')
          }
        }
      })
    }
  })

router.route('/books/:page')
  .get(function (req, res) {
    var languages = []
    var genres = []
    var reqLanguages = []
    var reqGenres = []
    var pagesCount
    var sort = {}
    if (typeof req.query.sort === 'undefined') {
      sort['date'] = -1
    } else {
      if (req.query.sort === 'Oldest') {
        sort['date'] = 1
      } else if (req.query.sort === 'Hrating') {
        sort['averageRating'] = -1
      } else if (req.query.sort === 'Lrating') {
        sort['averageRating'] = 1
      } else {
        sort['date'] = -1
      }
    }
    Meta
      .findOne({
        name: 'meta'
      }, function (err, meta) {
        if (err) {
          console.log(err)
        } else {
          languages = meta.languages
          genres = meta.genres
          Book.count({}, function (err, count) {
            if (err) {
              console.log(err)
            } else {
              pagesCount = Math.ceil(count / 9)
              if (typeof req.query.genre === 'string') {
                reqGenres.push(req.query.genre)
              } else {
                reqGenres = req.query.genre
              }
              if (typeof req.query.language === 'string') {
                reqLanguages.push(req.query.language)
              } else {
                reqLanguages = req.query.language
              }
              var token = new RegExp(req.query.search, 'i')
              Book
                .find({
                  title: {
                    $regex: req.query.search ? token : ''
                  },
                  genre: {
                    $in: req.query.genre ? reqGenres : genres
                  },
                  language: {
                    $in: req.query.language ? reqLanguages : languages
                  }
                })
                .limit(9)
                .skip((req.params.page - 1) * 9)
                .sort(sort)
                .exec(function (err, books) {
                  if (err) {
                    console.log(err)
                  } else {
                    res.render('books', {
                      volumes: books,
                      currentPage: parseInt(req.params.page),
                      lastPage: pagesCount,
                      genres: genres,
                      languages: languages
                    })
                  }
                })
            }
          })
        }
      })
  })

module.exports = router
