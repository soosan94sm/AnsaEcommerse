const categoryController=require('../controllers/categoryController')

const path = require('path')
const express = require('express')
const multer=require("multer")
const category_route = express()
category_route.use(express.urlencoded({ extended: true }))
category_route.set("view engine", "ejs")
category_route.set("views", "./views/admin")
const category_Auth=require("../middleware/adminMiddleware")

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, path.join(__dirname,'../public/admin/assets/uploads'))
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }
})


const upload = multer({storage:storage})
// get category page
category_route.get('/',category_Auth.isLogged,categoryController.getCategoryList)

// category edit

category_route.get('/edit',categoryController.getCategoryEditModal)

category_route.post('/edit',categoryController.postCategoryListEdit)

// category add

category_route.get('/addCategory',categoryController.getCategoryAddCat)


category_route.post('/addCategory',upload.single("file"),categoryController.postCategoryAddCat)


category_route.get("/isList", categoryController.getisList);

category_route.get("/unList",categoryController.getUnList);
category_route.post('/search',categoryController.getSearch)
module.exports= category_route