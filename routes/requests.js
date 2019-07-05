var router = require('express').Router()
var middleware = require('../middleware')
var Book = require('../models/book')
var Request = require('../models/request')
var User = require('../models/user')

router.route('/requests')
  .get(middleware.isLoggedIn,
    function (req, res) {
      res.redirect('/requests/sent')
    })
  .post(middleware.isLoggedIn,
    function (req, res) {
      Request
        .findOne({
          recieverBook: req.body.id,
          status: {
            $ne: 'completed'
          }
        })
        .exec(function (err, request) {
          if (err) {
            console.log(err)
          } else {
            if (!request) {
              Book
                .findOne({
                  _id: req.body.id
                })
                .exec(function (err, book) {
                  if (err) {
                    console.log(err)
                  } else {
                    if (book.user.equals(req.user._id)) {
                      res.send('You Own this Book')
                    } else {
                      var newRequest = new Request({
                        status: 'initial',
                        senderSeen: true,
                        recieverSeen: false,
                        date: Date.now(),
                        sender: req.user,
                        reciever: book.user,
                        recieverBook: book
                      })
                      newRequest.save()
                      res.send('request sent')
                    }
                  }
                })
            } else {
              res.end('already sent request')
            }
          }
        })
    })
  .put(middleware.isLoggedIn,
    function (req, res) {
      if (req.body.op === 'accept') {
        Request
          .findOne({
            _id: req.body.id
          })
          .exec(function (err, request) {
            if (err) {
              console.log(err)
            } else {
              request.status = 'pending'
              request.recieverSeen = false
              request.save()
              res.end()
            }
          })
      } else if (req.body.op === 'complete') {
        Request
          .findOne({
            _id: req.body.id
          })
          .exec(function (err, request) {
            if (err) {
              console.log(err)
            } else {
              Book
                .findOne({
                  _id: request.senderBook
                })
                .exec(function (err, book) {
                  if (err) {
                    console.log(err)
                  } else {
                    book.user = request.reciever
                    book.save()
                  }
                })
              Book
                .findOne({
                  _id: request.recieverBook
                })
                .exec(function (err, book) {
                  if (err) {
                    console.log(err)
                  } else {
                    book.user = request.sender
                    book.save()
                  }
                })
              request.status = 'completed'
              request.save(function (err, savedRequest, num) {
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
                          senderBook: request.senderBook

                        }, {
                          senderBook: request.recieverBook
                        }, {
                          recieverBook: request.senderBook
                        }, {
                          recieverBook: request.recieverBook
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
            }
          })
      }
    })
  .delete(middleware.isLoggedIn,
    function (req, res) {
      Request
        .remove({
          _id: req.body.id
        })
        .exec(function (err) {
          if (err) {
            console.log(err)
          } else {
            res.end()
          }
        })
    })

router.route('/requests/sent')
  .get(middleware.isLoggedIn,
    function (req, res) {
      Request
        .find({
          sender: req.user._id
        })
        .populate('reciever')
        .populate('senderBook')
        .populate('recieverBook')
        .sort({
          date: -1
        })
        .exec(function (err, requests) {
          if (err) {
            console.log(err)
          } else {
            var tempRequests = JSON.parse(JSON.stringify(requests))
            for (var request of requests) {
              request.senderSeen = true
              request.save()
            }
            res.render('sent-requests', {
              requests: tempRequests
            })
          }
        })
    })

router.route('/requests/recieved')
  .get(middleware.isLoggedIn,
    function (req, res) {
      Request
        .find({
          reciever: req.user._id
        })
        .populate('sender')
        .populate('senderBook')
        .populate('recieverBook')
        .sort({
          date: -1
        })
        .exec(function (err, requests) {
          if (err) {
            console.log(err)
          } else {
            var tempRequests = JSON.parse(JSON.stringify(requests))
            for (var request of requests) {
              request.recieverSeen = true
              request.save()
            }
            res.render('recieved-requests', {
              requests: tempRequests
            })
          }
        })
    })

router.route('/requests/choose')
  .get(function (req, res) {
    User
      .findOne({
        username: req.query.username
      })
      .exec(function (err, user) {
        if (err) {
          console.log(err)
        } else {
          Book
            .find({
              user: user._id
            })
            .sort({
              date: -1
            }).exec(function (err, books) {
              if (err) {
                console.log(err)
              } else {
                res.json({
                  books: books
                })
              }
            })
        }
      })
  })
  .post(middleware.isLoggedIn,
    function (req, res) {
      Book
        .findOne({
          _id: req.body.bookId
        })
        .exec(function (err, book) {
          if (err) {
            console.log(err)
          } else {
            Request
              .findOneAndUpdate({
                _id: req.body.requestId
              }, {
                senderSeen: false,
                status: 'countered',
                senderBook: book
              }, function (err, request) {
                if (err) {
                  console.log(err)
                } else {
                  res.end()
                }
              })
          }
        })
    })

module.exports = router
