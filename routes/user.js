var router = require('express').Router()
var User = require('../models/user')
var middleware = require('../middleware')
var Book = require('../models/book')
var passport = require('passport')

router.route('/user/edit')
  .get(middleware.isLoggedIn,
    function (req, res) {
      res.render('profile')
    })
  .post(middleware.isLoggedIn,
    middleware.checkProfile,
    passport.authenticate('local', {
      failureFlash: 'Invalid password.',
      failureRedirect: '/user/edit'
    }),
    function (req, res) {
      User.findOneAndUpdate({
        _id: req.user._id
      }, {
        email: req.body.email,
        country: req.body.country,
        fullname: req.body.fullname
      }, function (err, user) {
        if (err) {
          console.log(err)
        }
        if (req.body.newpassword !== '') {
          user.setPassword(req.body.newpassword, function () {
            user.save()
          })
        }
        req.flash('success', 'Information Changed Successfully')
        res.redirect('/user/edit')
      })
    })

router.route('/user/:username/books')
  .get(function (req, res) {
    User
      .findOne({
        username: req.params.username
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
                res.render('user-books', {
                  volumes: books,
                  username: user.username
                })
              }
            })
        }
      })
  })

module.exports = router
