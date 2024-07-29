const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/userModels')
const Products = require('../models/productModel')
const mongoose = require('mongoose');
const Banner = require("../models/bannerModel")
const session = require('express-session')
const otp = require("../config/otp");
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Coupon = require("../models/couponModel")
const { v4: uuidv4 } = require('uuid');
function generateShortUUID() {
  const uuid = uuidv4().split('-')[0]; // Get the first part of the UUID
  const shortUUID = '0' + uuid.slice(0, 4); // Take the first 4 characters and prepend #
  return shortUUID;
}
const userUtils = require("../utils/userUtils")
//to encrypt password
const securePassword = async (pass) => {
  try {
    const passHash = await bcrypt.hash(pass, 10)
    return passHash
  } catch (e) {
    console.log("password err", e.message);
  }
}
//load home page
module.exports.getUserHome = async (req, res) => {
  try {
    let user = 0;
   
    if (req.session.userId  ) {
      const userId = req.session.userId
      console.log("in load home: ", userId)
      user = await User.findOne({ email: userId });

      console.log(user)
    }
    const product = await Products.find({ isList: true })

    const category = await Category.find({ isList: true })
    const banner = await Banner.aggregate([
      {
        $match: {
          isList: true
        }
      }
    ]);
    res.render('home', { user, product: product, category: category, banner: banner });
  } catch (err) {
    console.error(err.message);
    // res.status(500).render('logout');
  }
}

//load login with password page
module.exports.getLogin = async (req, res) => {

  res.render('login')
}

module.exports.getLogout = async (req, res) => {

  req.session.userId = ""
  console.log("destroyed")
  res.redirect('/')
}

module.exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    //console.log(req.body);
    const user = await User.findOne({ email })
    //console.log(user);
    if (user) {
      const matchPass = await bcrypt.compare(password, user.password)
      if (matchPass) {

        if (user.isBlocked) {
          res.render("login", { message: "your account is blocked" })


        } else {
          req.session.userId = user.email
          //console.log(req.session.userId)
          res.redirect('/')
        }

      } else {
        res.render('login', { message: "please enter valid credentials" })
      }
    } else {
      res.render('login', { message: "Please Enter the registered email and password" })
    }

  } catch (err) {
    console.log(err);
  }
}

module.exports.getSignup = async (req, res) => {
  res.render('signup')
}

module.exports.postSignup = async (req, res) => {
  const { name, email, password, phone, confirmpassword } = req.body
  //console.log(req.file.filename)
  try{
    const {name,email,password,phone,confirmpassword}=req.body
    let existing = await User.find({$or:[{email:email},{phone:phone}]})

  
    if(existing.length === 0){
        if(confirmpassword !== password){
            res.render('signup',{message:"Password do not match"})
        }else if(!phone.match(/^[6789]\d{9}$/)){
            res.render('signup',{message:"Invalid mobile number"})
        }else{
            const bcryptPass = await securePassword(password)
            User.insertMany([{
                name:name,
                email:email,
                password:bcryptPass,
                phone:phone,
                profileImage:req.file.filename
            }])
            console.log(".......................req.body",req.body)
            console.log("user created successfully");

            res.render('otpLogin')
        }
    
}else{
    res.render('signup',{message:"User already exists"})
}
}catch (e) {
    console.log("postsignup", e.message);
  }

  

}
//login with op loading
module.exports.getOtp = async (req, res) => {
  res.render('otpValidation');
}

//to sednd otp
module.exports.postOtp = async (req, res) => {
  try {
    const phone = req.body.phone;
    console.log(phone);

   
    const user = await User.findOne({ phone: phone });
console.log(user)
    if (user) {
     
      const send = await otp.sendOTP(phone);

      

      res.render("otpVerification"); 
    } else {
      res.render("otpValidation", { message: "Phone number is not matched" }); // Render error message
    }
  } catch (err) {
    console.log("Error in postOtp: ", err.message);
  }
};





module.exports.postOtpVerify = async (req, res) => {
  try {
const otp=req.body.otp
const phone=req.body.phone
console.log("enteredOtp.......",req.body)

     
    

    const user=await User.findOne({phone:phone})
    console.log("otpdb",user)
    console.log("////>",user.otp===otp)
    
     if(user.otp===otp){
      
      req.session.userId = user.email
      
      res.redirect('/')
    } else {
     
      res.render("otpVerification", { message: "Invalid OTP. Please try again." });
    }
   }

  catch (e) {
    console.log(e.message);
  }
}
module.exports.getForgot=async(req,res)=>{
res.render("forgot")
}

module.exports.postForgot = async (req, res) => {
  try {
     console.log(",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,")
    const phone = req.body.phone;
    console.log(phone);

   
    const user = await User.findOne({ phone: phone });
console.log(user)
    if (user) {
     
      const send = await otp.sendOTP(phone);
//const userr=await User.findOneAndUpdate({phone:phone},{$set:{otp:}})
      

      res.render("passwordotp"); 
    } else {
      res.render("forgot", { message: "Phone number is not matched" }); // Render error message
    }
  } catch (err) {
    console.log("Error in postOtp: ", err.message);
  }
};
module.exports.postchangeee=async(req,res)=>{
try{const phone=req.body.phone

  console.log(phone)
  const user=await User.findOne({phone:phone})
  res.render("resetpass",{user})
}catch(e){
console.log(e)
}
}
module.exports.postChangePassword = async (req, res) => {
  try {

const otp=req.body.otp
const userId=req.body.Id
console.log("enteredOtp.......",req.body)

     
    

    const user=await User.findOne({_id:userId})
    console.log("otpdb",user)
    
    
     if(req.body.password===req.body.confirmpassword){
      const bcryptPass = await securePassword(req.body.password)
      const userr=await User.findOneAndUpdate({_id:userId},{$set:{password:bcryptPass}})
      res.redirect("/login")
      
    } else {
     
      res.render("resetpass", { message: "Invalid password. Please try again.",user });
    }
   }

  catch (e) {
    console.log(e.message);
  }
}
module.exports.getpasswordchange=async(req,res)=>{
 const userId=req.session.userId

 console.log("getpasswordchange..............",userId)
  const user=await User.findOne({email:userId})
  console.log(user)
  res.render("resetpass",{user})
}
module.exports.getProduct = async (req, res) => {
  try {
    let product;
    const user=await User.findOne({email:req.session.userId})
    if (req.query.id && req.session.userId) {
      const categoryy = await Category.find({ _id: req.query.id, isList: true });
      const category = await Category.find({})

      console.log(categoryy);
      categoryy.map(async (item) => {
         product = await Products.find({ category: item.categoryName, isList: true })
        console.log("000000000000000000000", product)

        const itemsPerPage = 6;
        const totalItems = product.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
    
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = product.slice(startIndex, endIndex);
    
       
    
      

        res.render('categorypro', { product: product ,user,totalPages: totalPages,
          currentPage: currentPage,})
      })

    }

    else {
      const category = await Category.find({})
      console.log("category.............", category)
       product = await Products.find({})
      console.log("product............", product)


      const itemsPerPage = 6;
      const totalItems = product.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
  
      const currentPage = req.query.page ? parseInt(req.query.page) : 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const itemsToShow = product.slice(startIndex, endIndex);
  

      res.render("product", { product: product, category: category ,user,totalPages: totalPages,
        currentPage: currentPage,})
    }

  
  
  }
   catch (err) {
    console.error(err);

  }}

// Modify your server route to handle category-specific product retrieval

module.exports.getdashboard=async(req,res)=>{
  res.render("dashboard")
}

module.exports.getProductDetail = async (req, res) => {
  let product =''
  if (req.session.userId) {
    console.log("req.query.id", req.query.id)
    product = await Products.find({ _id: req.query.id })

    res.render('productDetails', { product: product })
  }else{
    res.redirect('/login')
  }
  //console.log("products....",product)


}
module.exports.getCategory = async (req, res) => {
  try {
    if (req.query.id && req.session.userId) {
      const categoryy = await Category.find({ _id: req.query.id, isList: true });
      const category = await Category.find({})

      console.log(categoryy);
      categoryy.map(async (item) => {
        const product = await Products.find({ category: item.categoryName, isList: true })
        console.log("000000000000000000000", product)
        res.render('categorypro', { product: product })
      })
    }
  } catch (e) {
    console.log(e.message)
  }
}
// module.exports.getAbout = async (req, res) => {
//   res.render('about')
// }
module.exports.getContact = async (req, res) => {
  res.render('contact')
}
//user profile
module.exports.getProfilenav = async (req, res) => {
  res.redirect("/profile/account")

}
module.exports.getUserProfile = async (req, res) => {
  const userId = req.session.userId;
  console.log(userId)

  try {
    const user = await User.findOne({ email: req.session.userId })
    console.log(user)
    res.render('userprofile', { userdata: user, user: user })

  } catch (err) {
    console.error("getProfile", err.message);
  }
}

module.exports.postUserProfile = async (req, res) => {
  try {
    const { productId, count } = req.body;
    res.redirect("/profile/account")
    console.log("Message received from frontend:", productId, count, req.session.userId);
  } catch (err) {
    console.error("postCart", err.message);
  }
}
function upload() {
  const fileInput = document.getElementById('profilePictureInput');
  const file = fileInput.files[0];
  console.log(file);

  // Create a new FormData object
  const formData = new FormData();

  // Append the file to the FormData object with the desired field name
  formData.append('croppedimage', file);

  // Submit the form
  form.submit();
}

module.exports.getProfileImageUpload = async (req, res) => {
  try {
    const file = req.file;
    const fileName = file.filename;
    const mainImageFile = req.file.path;

    const croppedMainImage = await sharp(mainImageFile)
      .resize(500, 500, {
        fit: 'cover',
        position: 'top'
      })
      .toBuffer();

    const mainImageFilename = `cropped-${req.file.filename}`;

    // Specify the correct destination path for the cropped image
    const destinationPath = path.join(__dirname, '../admin/assets/uploads/', mainImageFilename);

    const croppp = await sharp(croppedMainImage)
      .toFile(destinationPath);

    const userdata = await User.findById(req.session.userId);
    userdata.profileImage = mainImageFilename;
    const trial = await userdata.save();

    res.redirect('/userprofile');
  } catch (err) {
    console.log("prof image upload >> ", err.message);
  }
};




module.exports.getCart = async (req, res) => {

  const getCartItems = async (user) => {
    const cartData = [];

    for (const item of user.cart) {
      const user = await User.findOne({ email: req.session.userId })
      const product = await Products.findOne({ _id: item.productId });
      if (product) {

        let total = item.quantity * product.price;
        console.log(item.quantity,"---")
        console.log(product.price,"---+++")
        console.log(total)
        cartData.push({ user: user, count: item.quantity, product: product, total: total });
      }


    }
    // console.log("888888888888888888888888888888888888",cartData)
    return cartData;

  };

  try {
    if (req.session.userId) {

      const user = await User.findOne({ email: req.session.userId }, { cart: 1, _id: 0 });
      //   console.log(user);
      let sub
      if (user) {
        const cartData = await getCartItems(user);
        //console.log(cartData)
        let totalArr = []
        cartData.map(item => {
          totalArr.push(item.total)
        })
        if (totalArr.length !== 0) {
          sub = totalArr.reduce((acc, sum) => { return acc + sum })
        }

        const uniqueCartItems = cartData.filter((item, index, self) =>
          index === self.findIndex(t => t.product && t.product._id.equals(item.product._id))
        );
        //console.log("uniqueCartItems",uniqueCartItems)
        res.render('cart', { user: user, cartItem: uniqueCartItems, subTotal: sub });

      } else {
        console.error("getCart: User not found");
        return res.status(404).send("User not found");
      }
    }
  } catch (e) {
    console.error("getCart", e.message);
    return res.status(500).send("Internal Server Error");
  }




}




module.exports.postAddToCart = async (req, res) => {
  try {

    const productId = new mongoose.Types.ObjectId(req.body.productId);// Assuming the product ID is sent in the request body
    // console.log(productId)
    //console.log("req.session.userId",req.session.userId)

    const user = await User.findOneAndUpdate({ email: req.session.userId }, {
      $push: {
        cart: { productId: productId } // Push an object with productId into the cart array
      }
    })
    //console.log("user..............................")
  } catch (err) {
    console.log("error", err.message)
  }

};

module.exports.getCartDelete = async (req, res) => {
  try {
    const id = req.query.id
    console.log("iiiiiiiiiiiiii", req.query.id)
    const userId = req.session.userId;
    console.log("2222222222222222222", userId)


    const userData = await User.findOneAndUpdate({ email: userId }, { $pull: { cart: { productId: id } } })
    //console.log("000000000000000000000000",userData.cart)
    res.redirect('/cart')
  } catch (err) {
    console.error("cart delete", err);
  }
}

module.exports.postCartQuantity = async (req, res) => {
  const getCartItems = async (user) => {
    const cartData = [];

    for (const item of user.cart) {
      const user = await User.findOne({ email: req.session.userId })
      const product = await Products.findOne({ _id: item.productId });

      if (product) {
        let total = item.quantity * product.price;

        cartData.push({ user: user, quantity: item.quantity, product: product, total: total });
      }


    }
    return cartData;
  };
  try {
    const { productId, quantity } = req.body;
    //console.log("Message received from frontend:", productId, count, req.session.userId);


    const product = await Products.findOne({ _id: productId });
    //console.log(product)

    let indTotal

    if (product) {
      if (quantity > product.stock) {
        return res.status(400).json({ success: false, message: "out of stock" });
      } else {
        indTotal = quantity * product.price

        await User.updateOne(
          { email: req.session.userId, "cart.productId": req.body.productId },
          { "cart.$.quantity": parseInt(quantity) } // Increment the count by the given value
        );

        const user = await User.findOne({ email: req.session.userId }, { cart: 1, _id: 0 });
        let sub
        if (user) {
          const cartData = await getCartItems(user);
          let totalArr = []
          cartData.map(item => {
            totalArr.push(item.total)
          })
          sub = totalArr.reduce((acc, sum) => { return acc + sum })
          // console.log(sub);
        }
        return res.status(200).json({ success: true, indTotal: indTotal, quantity: quantity, productId: productId, subTotal: sub });
      }

    }
    else if (req.session.userId === undefined) {
      res.render('productDetail', { product, message: "Please Login" })
    }

  } catch (err) {
    console.error("updateCart", err.message);
  }
}
module.exports.getCheckout = async (req, res) => {
  try {
    const getCartItems = async (user) => {
      const cartData = [];

      for (const item of user.cart) {
        const user = await User.findOne({ email: req.session.userId })
        const product = await Products.findOne({ _id: item.productId });
        console.log("user....................................", user)
        if (product) {
          let total = item.quantity * product.price;

          cartData.push({ user: user, count: item.quantity, product: product, total: total });
        }
      }
      //console.log(cartData)
      console.log("cartdata....................................", cartData)
      return cartData;
    };



    if (req.session.id) {
      const user = await User.findOne({ email: req.session.userId }, { cart: 1, _id: 0 });
      const userList = await User.findOne({ email: req.session.userId })
      //   console.log(user);

      if (user) {
        const cartData = await getCartItems(user);
        let totalArr = []
        cartData.map(item => {
          totalArr.push(item.total)
        })
        sub = totalArr.reduce((acc, sum) => { return acc + sum })
        //   [{count,product}]
        const uniqueCartItems = cartData.filter((item, index, self) =>
          index === self.findIndex(t => t.product && t.product._id.equals(item.product._id))
        );
        console.log(userList.address.items);
        const currentDate = new Date();
        const availableCoupon = []
        const coupons = await Coupon.find({ isList: true })
        // const coupons = await Coupon.find({isList:true,userId:{$ne:userList._id}})
        coupons.forEach(item => {



          const exp = new Date(item.expiryDate)
          const bool = exp >= currentDate
          console.log(bool,"boooooooooooooooooooooo2i");
          if (bool) {
            availableCoupon.push(item)
          }

        })

        console.log("availableCoupon", availableCoupon);
        res.render('checkout', { user: userList, addressList: userList.address.items, productData: uniqueCartItems, total: sub, coupon: availableCoupon })
      }
    }
  } catch (err) {
    console.error("getCheckout", err.message);



  }
}

module.exports.getConfirmOrder = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.userId })
    res.render('confirmOrder', { user: user })
  } catch (err) {
    console.error("getConfirmOrder", err.message);
  }
}


module.exports.postCheckout = async (req, res) => {

  const getCartItems = async (user) => {
    const cartData = [];

    for (const item of user.cart) {
      const user = await User.findOne({ email: req.session.userId })
      const product = await Products.findOne({ _id: item.productId });
      if (product) {
        let total = item.quantity * product.price;

        cartData.push({ user: user, count: item.quantity, product: product, total: total });
      }
    }
    return cartData;
  };
  try {
    const grandTotal = Number(req.body.total);
    const paymentMode = req.body.paymentMode;
    const address = req.body.address;

    const user = await User.findOne({ email: req.session.userId }, { cart: 1 });

    if (user) {
      const orderItems = []; // Change the variable name here

      user.cart.forEach(item => {
        orderItems.push({
          product_id: item.productId,
          quantity: item.quantity,
        });
      });

      console.log("orderItem................", orderItems)
      // Handle the case where the product is not found
      orderItems.forEach(async (orderItem) => {
        try {
          // Find the product in the database by product_id
          const product = await Products.findOne({ _id: orderItem.product_id });

          // console.log("productts======",product);
          // If the product is found, decrement the stock_quantity
          if (product) {
            product.stock -= orderItem.quantity;

            // Save the updated product back to the database
            await product.save();
          }

          // const coupon = await Coupon.findOneAndUpdate(
          //     { _id: couponId },
          //     {
          //       $push: { userId: user._id }
          //     },
          //     { new: true } // To return the updated document
          //   );

          // console.log("Updated Coupon:", coupon);
        } catch (error) {
          console.error('Error updating product stock:', error);
        }
      });

      const orderid = generateShortUUID();
      const currentDate = new Date();
      // Add 10 days to the current date I am setting 10days after purchase date for delivery date

      const updatedDate = currentDate.setDate(currentDate.getDate() + 10);
      const order = await Order.create({
        orderId: orderid,
        address: address,
        user: user._id,
        orderItem: orderItems,
        paymentMethod: paymentMode,
        totalAmount: grandTotal,

        deliveryDate: updatedDate
      });


      // console.log(updatedDateAsString);
      // console.log(order);
      await User.updateOne(
        { email: req.session.userId },
        { $unset: { "cart": 1 } }
      )
      return res.status(200).json({ success: true });
    }
  }
  catch (err) {
    console.error("postCheckout", err.message);
    res.status(400).json({ success: false });
  }
}





module.exports.postSearch = async (req, res) => {
  try {

    const searchQuery = new RegExp("^" + req.body.search, "i");
    const banner=await Banner.findOne({ isList: true})
    // Adding "i" flag for case-insensitive search
    const user = await User.findOne({ isBlocked: false })
    const category = await Category.find({ isList: true })
    const products = await Products.find({ productName: { $regex: searchQuery } })
    //console.log("search ",products)  
    if (products.length === 0) {
      res.render('home', { product: [], user: user, product: products, category: category,banner })
    } else {
      res.render('home', { user: user, product: products, category: category,banner })
    }

  }
  catch (err) {
    console.log(err.message)
  }
}
module.exports.geterror = async (req, res) => {
  res.render("error")
}
module.exports.postCouponUpdate = async (req, res) => {
  try {
    console.log(req.body);
    const couponId = req.body.couponId
    const user = await User.findOne({ email: req.session.userId })
    console.log(user._id);

    

    return res.status(200).json({ success: true, couponId });




  } catch (err) {
    console.error("postCouponUpdate ===>", err.message);
  }
}
module.exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.find({ orderStatus: 'delivered' });

    console.log("redering from invoice");
    res.render("invoice", { order: order })
  } catch (e) {
    console.log(e.message)

  }
}
module.exports.postInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order by orderId
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }

    if (order.deliveryDate === null) {
      return res.status(400).json({ message: 'Order has not been delivered yet' });
    }

    // Calculate the invoice amount based on the delivered products
    const deliveredProducts = order.orderItem.filter(item => item.orderStatus === 'delivered');
    let invoiceAmount = 0;
    for (const product of deliveredProducts) {
      invoiceAmount += product.quantity * product.product_id.price; // Assuming 'price' is a field in your product schema
    }

    // You can customize the invoice format as needed
    const invoice = {
      orderId: order.orderId,
      customer: order.user.username, // Assuming 'username' is a field in your 'User' schema
      invoiceAmount: order.totalAmount,
      deliveryDate: order.deliveryDate,
    };

    console.log("responsing from invoice post");
    return res.json(invoice);
  } catch (err) {
    console.log(err.message)
  }
}
module.exports.postProfileImageUpload=async(req,res)=>{
try{const image=req.file
 
  console.log("file;;;;;;;;;;",req.file)
  const user=await User.findOne({email:req.session.userId})
  const userr=await User.findOneAndUpdate({email:req.session.userId},{$set:{profileImage:req.file.filename}})
res.render("userprofile",{user:user,userdata:user})
}catch(e){
 console.log(e.message) 
}
}
