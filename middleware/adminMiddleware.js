const twilio = require('twilio')
const crypto = require('crypto')
const Admin = require('../models/adminModel')
//const userUtils = require('../utils/userUtils')
//const { log } = require('console')
require('dotenv').config()

module.exports.isLoggin=(req,res,next)=>{
   
    if(req.session.admin){
        res.redirect('/admin/dashboard') 
    }else{
        console.log("in middleware")
    next();  
    }
}

module.exports.isLogged=(req,res,next)=>{

    if(req.session.admin){
        next();
    }else{
        res.redirect("/admin")
    }
}