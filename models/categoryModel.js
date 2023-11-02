const mongoose = require('mongoose')
const db = require('../config/db')

const categorySchema = new mongoose.Schema({
    
    categoryName:{
        type: String,
        required:true,
        lowercase: true
    },
    image:{
        type:String,
        required:true
    
    },
    description:{
        type: String
        
    },
   
    isList:{
      
        type: Boolean,
        default:true
 }

})
const Category = db.model('Category',categorySchema)
module.exports=Category