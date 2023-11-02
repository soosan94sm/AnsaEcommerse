const Category = require('../models/categoryModel')
const Products = require('../models/productModel')
const fs = require('fs');




module.exports.getCategoryList=async(req,res)=>{
    try{
console.log(req.session.admin)
        const cat =await Category.find({})
       
        if(cat){
            res.render('categoryList', {categories: cat})
            console.log(cat)
        }
    }catch(err){
        console.error(err);
    }
}
module.exports.getCategoryDelete = async(req,res)=>{
    try{
        const id = req.query.id
        const shouldDelete = req.query.confirm === 'true'; // Check the query parameter
  
      if (shouldDelete) {
        // Perform the deletion only if confirmed
        await Category.updateOne({ _id: id }, { $set: { isList: false } });
      }
        res.redirect('/admin/category')
    }catch(err){
        console.error(err);
    }
}
module.exports.getCategoryEditModal = async(req,res)=>{
   
   try{
    const id = req.query.id
    console.log("editcategory.............",id)
    const category=await Category.findOne({_id:id})
    console.log(category);
    res.render('editModel',{category:category})
   }catch(err){
    console.error(err);
   }
}
module.exports.postCategoryListEdit = async (req, res) => {
    try {
        const id = req.query.id;
        console.log("editcategory", id);

        // Find the category by its ID
        const category = await Category.findOne({ _id: id });
        console.log(category);

        const { categoryName } = req.body; // Destructure categoryName from req.body

        if (categoryName.trim() === "") {
            return res.render('addCat', { message: "Invalid category name" ,category});
        } else {
            // Update the category's name
            await Category.findOneAndUpdate({ _id: id }, { categoryName: categoryName });

            // Redirect to the category listing page
            res.redirect('/admin/category');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error"); // Handle the error appropriately
    }
}


module.exports.getCategoryAddCat=async(req,res)=>{
    res.render('addCat')
}

module.exports.postCategoryAddCat = async(req,res)=>{
    try{
        const existing =await Category.findOne({categoryName:req.body.categoryName})
        console.log(req.body, " body post controller")
          console.log(req.file.filename, " files post controller")
        if(existing){
            if(req.body.categoryId === existing.categoryId){
                 res.render('addCat',{message:"Category already exists"})
            }else{
                res.render('addCat',{message:"Category already exists"})
            }
        }else {
            await Category.insertMany([{
               
                categoryName:req.body.categoryName,
                image:req.file.filename,
                description:req.body.description
            }])
             res.redirect('/admin/category')
        }
        
    }catch(err){
        console.error("post add cat",err);
    }
}
module.exports.getisList= async (req, res) => {
    try {
       const userId = req.query.id;
       console.log(userId);
       const user = await Category.findOneAndUpdate({ _id: userId }, { isList: false });
        res.redirect('/admin/category')
       
     }catch (e) {
        console.error(e);
     }
 }
module.exports.getUnList= async (req, res) => {
    try {
       const userId = req.query.id;
       console.log(userId);
       const user = await Category.findOneAndUpdate({ _id: userId }, { isList: true });
        res.redirect('/admin/category')
    } catch (e) {
       console.error(e);
    }
 }
 module.exports.getSearch = async(req,res)=>{
    const searchQuery = new RegExp("^" + req.body.search, "i"); 
    // Adding "i" flag for case-insensitive search

    Category.find({ categoryName: { $regex: searchQuery } }).then((cat) => {
      if (cat.length === 0) {
        res.render('categoryList',{categories:[]})
      } else {
        res.render('categoryList',{categories:cat})
      }
    });
  
}