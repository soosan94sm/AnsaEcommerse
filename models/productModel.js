const mongoose = require('mongoose')
const db = require('../config/db')

const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required: true,
       
        lowercase: true
    },
  
    price:{
        type:Number,
        required:true,
    },
    stock:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    images:{
        type:Array,
        required:true
    },
    category: {
        type: String
       
      },
    discount:{
        type:String
    },
    
    isList:{
      
           type: Boolean,
           default:true
    }

    
})

const Products = db.model("Products",productSchema)
module.exports = Products