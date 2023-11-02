const mongoose = require('mongoose')
const db = require('../config/db.js')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        
    },
    email:{
        type:String,
    },
    phone:{
        type:Number,
    },
    password:{
        type:String,
    },
    profileImage:{
        type:String
    },
    wallet:{
        type:Number,
        default:100000,
    },
    address:{
        items: [{
            name: {
                type: String,
                required:true
            },
            phone: {
                type:Number,
                required: true,
            },
            houseNumber: {
                type: String,
                require: true
            },
            pincode:{
                type:Number,
                required: true,
            },
           
            address:{
                type: String,
                required:true
            },
            city: {
                type: String,
                required:true
            },
            state: {
                type: String,
                required:true
            },
            landmark: {
                type: String
            },
            alternatePhone: {
                type:Number
            }
        }]
    },
    resetToken:{
        type:String
    },
    otp:{
        type:String

    },
    otpCreate:{
        type:Date
    },
    cart:[{
        quantity:{
            type:Number,
            default:1
        },
       
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Products'
        }

    }],
    isBlocked:{
        type:Boolean,
        default:false
    }
})



const User = db.model('User',userSchema)
module.exports = User