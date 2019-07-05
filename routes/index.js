var router = require('express').Router()
var passport = require('passport')
var User = require('../models/user')
var middleware = require('../middleware')
var Book = require('../models/book')

router.route('/')
  .get(function (req, res) {
    Book
      .find({})
      .sort({
        date: -1
      })
      .limit(4)
      .exec(function (err, books) {
        if (err) {
          console.log(err)
        } else {
          Book.count({}, function (err, count) {
            if (err) {
              console.log(err)
            } else {
              res.render('index', {
                volumes: books,
                count: count
              })
            }
          })
        }
      })
  })

router.route('/login')
  .get(function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      res.render('login')
    }
  })
  .post(passport.authenticate('local', {
    successRedirect: '/',
    failureFlash: 'Invalid password/username.',
    failureRedirect: '/login'
  }), function (req, res) {

  })

router.route('/register')
  .get(function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      res.render('register')
    }
  })
  .post(middleware.checkRegister, function (req, res) {
    User.register(new User({
      username: req.body.username,
      email: req.body.email,
      fullname: req.body.fullname,
      country: req.body.country
    }), req.body.password, function (err, user) {
      if (err) {
        req.flash('error', err)
        console.log(err)
        return res.redirect('/register')
      }
      passport.authenticate('local')(req, res, function () {
        res.redirect('/')
      })
    })
  })

router.route('/logout')
  .get(function (req, res) {
    req.logout()
    res.redirect('/')
  })

module.exports = router
