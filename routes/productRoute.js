const express = require('express')
const productController = require('../controllers/productController')
const product_route = express()
//const multer = require('../middleware/multer')

const path = require('path')
const auth = require('../middleware/adminMiddleware')


product_route.set("view engine", "ejs")
product_route.set("views", "./views/admin")
product_route.use(express.urlencoded({ extended: true }))
product_route.use(express.static("public"))


const multer = require('multer');



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/admin/assets/uploads'); // Specify the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Define the file naming strategy
  },
});

const upload = multer({ storage: storage });



product_route.get('/',auth.isLogged,productController.getProductList)
// add product
product_route.get('/addProduct',productController.getAddProduct)

product_route.post('/addProduct',upload.array('images'),productController.postAddProduct)
product_route.post('/upload',productController.postupload)

// edit product
product_route.get('/edit',productController.getEditProduct)

product_route.post('/edit',upload.array('images'),productController.postEditProduct)

// delete product
//product_route.get('/delete',productController.getProductDelete)
product_route.get("/isList", productController.getisList);

product_route.get("/unList",productController.getUnList);
product_route.post('/search',productController.postSearch)
 



module.exports= product_route