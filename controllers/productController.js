//const { log } = require('console');
const express=require("express")
const mongoose=require('mongoose')
const Products = require('../models/productModel')
const fs = require('fs');
const Category = require('../models/categoryModel');
const path=require("path")
const ObjectId = mongoose.Types.ObjectId;

module.exports.getProductList=async(req,res)=>{
    
    try{

        const pdt =await Products.find({isList:true})
       console.log(pdt);

       const itemsPerPage = 12;
    const totalItems = pdt.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = pdt.slice(startIndex, endIndex);

   

    res.render('productList',{products:pdt,totalPages: totalPages,
      currentPage: currentPage, });

      
    }catch(err){
        console.error(err);
    }
}
module.exports.getAddProduct = async (req, res) => {
    try{const cat=await Category.find({})
    //console.log(cat)
    res.render('addProduct',{category:cat});}
    catch(err){
console.log("getAddProduct",err.message)
    }
};


module.exports.postAddProduct = async (req, res) => {
  try {
      const existing = await Products.findOne({ productName: req.body.productName });
      console.log(req.body, "--->body");

      // Retrieve the category outside of the conditional block
      const category = await Category.findOne({categoryName: req.body.category});
console.log("...........................................",category)
      if (existing) {
          return res.render('addProduct', { category:category, message: "Product already exists" });
      } else {
          const arrImages = [];
          for (let i = 0; i < req.files.length; i++) {
              arrImages[i] = req.files[i].filename;
          }

          if (category) {
            const product = new Products({
              productName: req.body.productName,
              price: req.body.price,
              stock: req.body.stock,
              description: req.body.description,
              category: req.body.category,
              images: arrImages,
          });
          console.log("product.........",product)
          await product.save();
            

              return res.redirect('/admin/products');
          } else {
              return res.render('addProduct', { category, message: "Category not found" });
          }
      }
  } catch (err) {
      console.error(err.message);
      // Handle the error appropriately
  }
};




module.exports.postupload=async(req, res) => {
  const cat=await Category.find({})
  res.render('addProduct',{category:cat});
  const croppedImages = req.body.croppedImages;
console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",req.body)
  // Save each cropped image to a file
  croppedImages.forEach((imageData, index) => {
      // Decode and save imageData as a file (e.g., using fs module)
      const fileName = `cropped_image_${index}.jpg`;
      const imageDataBuffer = Buffer.from(imageData, 'base64');

      fs.writeFile(fileName, imageDataBuffer, (err) => {
          if (err) {
              console.error(err);
          }
      });
  });

  res.send('Images uploaded successfully!');
}
module.exports.getEditProduct=async(req,res)=>{
  try{
    const id = req.query.id
    console.log(" req.query.id",id)
    const product=await Products.findOne({_id:id})
    console.log("......product",product)
    //  console.log((product._id).toString());
   
    let cat=await Category.find({categoryName:product.category})
    // let pdtid=product.category.toString()
    console.log("cat......",cat)
    //  console.log("pdt",pdtid);
   
     const categories = await Category.find({isList:true});
    //   console.log(cat.categoryName);
    res.render('editProduct',{product:product,categoryName:cat.categoryName,categories:categories})
   }catch(err){
    console.error("getEditProduct",err.message);
   }
}

const deleteImages = (images) => {
    images.forEach((image) => {
      const imagePath = path.join(__dirname, 'public', 'images', image);
  
      // Use fs.unlink to delete the file from the server
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Error deleting image: ${err}`);
        } else {
          console.log(`Image ${image} deleted successfully.`);
        }
      });
    });
  };
module.exports.postEditProduct=async(req,res)=>{
    const deleteImages = req.body.deleteImage;
    console.log("body,,,,,,,,,,,",req.body);

    try{
        
        const pdtId=req.body.productIdentity
     console.log("(pdtIddelete img",pdtId);
    const arrImages = [];
    for (let i = 0; i < req.files.length; i++) {
        arrImages[i] = req.files[i].filename;
    }
    const product =await Products.findOneAndUpdate({_id:pdtId},{
        productId: req.body.productId,
        productName: req.body.productName,
        price: req.body.price,
        stock: req.body.stock,
        description: req.body.description,
        discount: req.body.discount,
        category: req.body.selectcategory,
         //images: arrImages
    })
    console.log("pppppppppppppppppppppppp",product)
    res.redirect('/admin/products')
    }catch(err){
        console.error(err);
    }
}

  module.exports.getisList= async (req, res) => {
    try {
       const userId = req.query.id;
       console.log(userId);
       const user = await Products.findOneAndUpdate({ _id: userId }, { isList: false });
        res.redirect('/admin/products')
       
     }catch (e) {
        console.error(e);
     }
 }
module.exports.getUnList= async (req, res) => {
    try {
       const userId = req.query.id;
       console.log(userId);
       const user = await Products.findOneAndUpdate({ _id: userId }, { isList: true });
        res.redirect('/admin/products')
    } catch (e) {
       console.error(e);
    }
 }

 module.exports.postSearch = async(req,res)=>{
    const searchQuery = new RegExp("^" + req.body.search, "i"); 
    // Adding "i" flag for case-insensitive search

    Products.find({ productName: { $regex: searchQuery } }).then((pro) => {
      if (pro.length === 0) {
        res.render('productList',{products:[]})
      } else {
        res.render('productList',{products:pro})
      }
    });
  
}