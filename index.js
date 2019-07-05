const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const flash = require('connect-flash')

require('dotenv').config()

const User = require('./models/user')
const Request = require('./models/request')
const Meta = require('./models/meta')

const indexRoutes = require('./routes/index')
const booksRoutes = require('./routes/books')
const userRoutes = require('./routes/user')
const requestsRoutes = require('./routes/requests')

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(require('express-session')({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(flash())
app.use(express.static(path.join(__dirname, '/public')))
app.set('view engine', 'ejs')

//  Passport config
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(async function (req, res, next) {
  res.locals.currentUser = req.user
  res.locals.error = req.flash('error')
  res.locals.success = req.flash('success')
  if (req.isAuthenticated()) {
    try {
      const count = await Request.count({ $or: [
        {
          sender: req.user._id,
          senderSeen: false
        },
        {
          reciever: req.user._id,
          recieverSeen: false
        }] })
      res.locals.requestsCount = count
    } catch (err) {
      console.log(err)
    }
  }
  next()
})

// Creates a meta file if there is none in the db
Meta.find({}, function (err, metas) {
  if (err) return console.log(err)
  if (!metas) {
    const meta = new Meta({
      name: 'meta',
      languages: [],
      genres: []
    })
    meta.save()
  }
})

app.use(indexRoutes)
app.use(booksRoutes)
app.use(userRoutes)
app.use(requestsRoutes)

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI,
      { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
    console.log('connected to database')
    await app.listen(process.env.PORT || 3000)
    console.log(`listening on port ${process.env.PORT || 3000} ...`)
  } catch (err) {
    console.log(err)
  }
}

start()
