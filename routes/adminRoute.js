const express=require("express")
const admin_route=express()
const path = require('path')
const multer=require("multer")
const adminController=require("../controllers/adminControllers");
const couponController=require("../controllers/couponController")
const salesController=require("../controllers/salesController")
const bannerController=require("../controllers/bannerController")
const adminAuth=require("../middleware/adminMiddleware")
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, path.join(__dirname,'../public/admin/assets/uploads'))
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }
})


const upload = multer({storage:storage})
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

admin_route.get('/',adminAuth.isLoggin,adminController.getLogin)
admin_route.post('/',adminController.postLogin)

//admin_route.get('/user',adminController.adminUsersList)
admin_route.get('/user',adminAuth.isLogged,adminController.getAdminLDashbaordUsers)
//admin_route.get('/dashboard',(req,res)=>{res.send("hiii")})
admin_route.get('/dashboard',adminController.adminUsersList)

//admin_route.put('/users/:userId/block', adminController.blockUser);
admin_route.get("/user/block", adminController.getBlockUser);

admin_route.get("/user/unblock",adminController.getUnBlockUser);


admin_route.get('/logout',adminController.getLogout) 

admin_route.get('/order',adminController.getOrderList)

admin_route.post('/paginate',adminController.paginate);
// cancel order
//admin_route.post('/conformOrder',(req,res)=>{console.log("ghhhhhhhhhhgggg")}) 
admin_route.post('/conformOrder',adminController.postConforming) 
admin_route.post('/cancelOrder',adminController.postCancelOrder)
admin_route.post('/orderUpdate',adminController.postOrderUpdate)
admin_route.get( "/order/admindetails", adminController.getOrderDetails);
//coupon management
admin_route.get("/coupon", couponController.getCoupons);
admin_route.get("/addcoupon", couponController.getAddcoupon);
admin_route.post("/addcoupon", couponController.postAddcoupon);
admin_route.get("/editCoupon", couponController.getEditCoupon);
admin_route.post("/editCoupon", couponController.postEditCoupon);
admin_route.get("/coupon/delete", couponController.getCouponDelete);
admin_route.get("/sales-report", salesController.getSalesReport);
 admin_route.post("/sales-report", salesController.postSalesReport);

// admin_route.post("/report-order", salesController.postReport);
admin_route.post("/generatepdf", salesController.postGeneratePdf);
admin_route.post('/search',adminController.getSearch)
admin_route.post('/graphData',adminController.postGraph)

//banner
admin_route.get('/banner',bannerController.getBanner)
admin_route.get('/banner/addBanner',bannerController.getAddBanner)
admin_route.post('/banner/addBanner',upload.single("file"),bannerController.PostAddBanner)
admin_route.get('/banner/delete',bannerController.getBannerDelete)
admin_route.post('/banner/search',bannerController.postBannerSearch)





module.exports=admin_route;