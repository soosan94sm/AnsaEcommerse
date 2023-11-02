const twilio = require('twilio')
const crypto = require('crypto')
const User = require('../models/userModels')
//const userUtils = require('../utils/userUtils')
//const { log } = require('console')
require('dotenv').config()

module.exports.isLoggin = (req, res, next) => {
    console.log("im middleware>> ", req.session.userId)
    if (req.session.userId) {
        res.redirect('/')
    } else {
        console.log("in middleware")
        next();
    }
}
module.exports.isBlocked = async (req, res, next) => {
    console.log("isbloked", req.session.userId)
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email: req.session.userId })

        if(!req.session.userId){
            res.redirect('/login')

        }

        else if (user.isBlocked) {
            req.session.userId="";
            res.redirect("/")
        } else {
            console.log("in middleware")
            next()


        }
    } catch (err) {
        console.log(err.message)
    }

}
