const User = require('../models/user')

const middlewareObj = {}

middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}

middlewareObj.checkRegister = async function (req, res, next) {
  const { body: { email, password, fullname, country, terms, repeatPassword } } = req
  async function getMessage () {
    if (!email) return { status: 'error', message: 'Email is required' }
    if (!password) return { status: 'error', message: 'Password is required' }
    if (!fullname) return { status: 'error', message: 'Full Name is required' }
    if (!country) return { status: 'error', message: 'Country is required' }
    if (!terms) return { status: 'error', message: 'YOU HAVE TO AGREE!!!' }
    if (password !== repeatPassword) return { status: 'error', message: 'Password does not match' }
    if (await emailExists(email)) return { status: 'error', message: 'Email Already Exists' }
    return { status: 'success', message: 'Registration Completed Successfully' }
  }

  try {
    const { status, message } = await getMessage()
    req.flash(status, message)
    console.log(status, message)
    return (status === 'error') ? res.redirect('/register') : next()
  } catch (err) {
    console.log(err)
    res.redirect('/register')
  }
}

middlewareObj.checkProfile = async function (req, res, next) {
  const { body: { email, password, fullname, country, repeatPassword } } = req
  async function getMessage () {
    if (!email) return { status: 'error', message: 'Email is required' }
    if (!fullname) return { status: 'error', message: 'Full Name is required' }
    if (!country) return { status: 'error', message: 'Country is required' }
    if (password !== repeatPassword) return { status: 'error', message: 'Password does not match' }
    if (await emailExists(email, req.user.email)) return { status: 'error', message: 'Email Already Exists' }
    return { status: 'success', message: 'Changes Saved' }
  }

  const { status, message } = await getMessage()
  req.flash(status, message)

  return (status === 'error') ? res.redirect('/user/edit') : next()
}

const emailExists = async function (email, currentEmail = null) {
  try {
    if (currentEmail && (currentEmail === email)) return false
    let user = await User.findOne({ email: email })
    return !!user
  } catch (err) {
    console.log(err)
    return true
  }
}

module.exports = middlewareObj
