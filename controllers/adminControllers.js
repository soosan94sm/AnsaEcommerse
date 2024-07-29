
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModel');
const User = require('../models/userModels');
const Order=require("../models/orderModel");
const Products = require('../models/productModel');
const Coupon=require("../models/couponModel")
module.exports.getLogin = async(req,res)=>{
    res.render('login')
}
module.exports.postLogin = async(req,res)=>{
    try{
  
        const {email,password}=req.body
      
        const admin = await Admin.findOne({email})
       
        if(admin){
            const matchPass = await bcrypt.compare(password,admin.password)
            if(matchPass){
               //   const products = await Products.find({})
             req.session.admin=admin.email
                 res.redirect('/admin')
                }else{
            res.render('login',{message:"please enter valid credentials"})
}
        }else{
            res.render('login',{message:"Please Enter the registered email and password"})
        }
        
    }catch(err){
        console.log(err);
    }}

    // module.exports.adminUsersList = async (req, res) => {
    //     try {
    //       // if (!req.session.admin_id) {
    //       //   return res.redirect("/admin");
    //       // }
          
    //       const searchTerm = req.query.search;
    //       const query = {};
      
    //        if (searchTerm) {
    //          const regex = new RegExp(searchTerm, "i");
    //          query.$or = [
    //           { name: regex },
    //            { email: regex }
    //          ];
    //        }
   
    //       const users = await User.find(query).lean();
    //       res.render("dashboard", { users:users, searchTerm:searchTerm });
    //     } catch (error) {
    //       console.error("Error", error);
    //       res.status(500).send("An error occurred while fetching user data");
    //     }
    //   };
      
      module.exports.adminUsersList = async(req,res)=>{
         //console.log(req.session);
         console.log("ssssss")
        const admin = await Admin.findOne({ email: req.session.adminId });
        const users= await User.find({})
        const products= await Products.find({})
         console.log("user length ====",users.length);
         console.log("product length =====",products.length);
        const orders = await Order.aggregate([
            {
                $unwind:"$orderItem"
            },
           
        ])
        const allOrderes = await Order.aggregate([
            {
                $unwind:"$orderItem"
            },
            {
                $match:{
                    'orderItem.orderStatus':"delivered"
                }
            }
        ])
        const pending = await Order.aggregate([
            {
                $unwind:"$orderItem"
            },
            {
                $match:{
                    'orderItem.orderStatus':"pending"
                }
            }
        ])
        const cancel = await Order.aggregate([
            {
                $unwind:"$orderItem"
            },
            {
                $match:{
                    'orderItem.orderStatus':"cancel"
                }
            }
        ])
        console.log(allOrderes.length,"deeel");
        console.log(pending.length,"pennnd");
        console.log(cancel.length,"cancel");

        const status=[{
            delivered:allOrderes.length,
            pending:pending.length,
            cancelled:cancel.length
        }]
        let totalAmount =0
        orders.forEach(item=>{
            totalAmount += item.totalAmount
             console.log(item.orderItem);
        })
        // console.log(totalAmount);
        const productDetail = [{
            totalAmount,
            users:users.length,
            products:products.length,
            orders:orders.length,

        }];


const orderData=await Order.find({})
console.log(orderData)
 console.log(productDetail);
        res.render('dashboard',{productDetail,allOrderes,status,orderData})
    }  

    
  
    module.exports.getAdminLDashbaordUsers=async(req,res)=>{
       console.log(req.session.admin);

          try{
              const adminData = await Admin.findOne({email:req.session.admin})
         
              if(adminData){
                  const users = await User.find({})
               
                  res.render('usersListAdmin',{users:users})
              
              }
          }catch(err){
              console.error("Error:", err);
              res.send("An error occurred");
          }
      
   }

    module.exports.getBlockUser= async (req, res) => {
      try {
         const userId = req.query.id;
         //console.log(userId);
         const user = await User.findOneAndUpdate({ _id: userId }, { isBlocked: true });
          res.redirect('/admin/user')
      } catch (e) {
         console.error(e);
      }
   }
  module.exports.getUnBlockUser= async (req, res) => {
      try {
         const userId = req.query.id;
         //console.log(userId);
         const user = await User.findOneAndUpdate({ _id: userId }, { isBlocked: false });
          res.redirect('/admin/user')
      } catch (e) {
         console.error(e);
      }
   }
   
 
  
  module.exports.getOrderList=async(req,res)=>{
    try{
      const pipeline = [
        {
          $lookup: {
            from: 'users', // Replace with your actual collection name for users
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $unwind: '$orderItem'
        },
        {
          $lookup: {
            from: 'products', // Replace with the actual collection name for products
            localField: 'orderItem.product_id',
            foreignField: '_id',
            as: 'orderItem.product'
          }
        },
        {
          $group: {
            _id: '$orderId', // Group by orderId to eliminate duplicates
            user: { $first: '$user' },
            orderId: { $first: '$orderId' },
            orderItem: { $push: '$orderItem' }, // Keep the original orderItems array
            totalAmount: { $first: '$totalAmount' },
            purchaseDate: { $first: '$purchaseDate' },
            deliveryDate: { $first: '$deliveryDate' },
            paymentMethod: { $first: '$paymentMethod' }
          }
        },
        {
          $project: {
            _id: 0,
            user: 1,
            orderId: 1,
            orderItem: 1,
            totalAmount: 1,
            purchaseDate: 1,
            deliveryDate: 1,
            paymentMethod: 1
          }
        }
      ];
      
      const orderLists = await Order.aggregate(pipeline);
      
      
      console.log("-----------");
       console.log(orderLists,"-----------------");
      
      
      
    
    
        const itemsPerPage = 6;
        const totalItems = orderLists.length;
        console.log("totalItems------------>",totalItems)
        const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log("totalPages----->",totalPages)
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        console.log("currentPage",currentPage)
        const startIndex = (currentPage - 1) * itemsPerPage;
        console.log(" startIndex--->", startIndex)
        const endIndex = startIndex + itemsPerPage;
        console.log("endIndex--->",endIndex)
        const itemsToShow = orderLists.slice(startIndex, endIndex);
    
        const innerArrays = itemsToShow.map(item => item.orderItem);
        const item=itemsToShow.map(item=>item)
        console.log("Inner arrays:", innerArrays.length, '$$$',item.length);
      console.log("inneraray",innerArrays);

      console.log("itemsToShow............",itemsToShow)
        res.render('orderManagement',{orders:orderLists,items: itemsToShow,orderItems:innerArrays,
          totalPages: totalPages,
          currentPage: currentPage,})
    }catch(err){
        console.error("getOrderList",err.message);
    }
    }
    
    
    module.exports.postOrderUpdate=async(req,res)=>{
        try{
            console.log("11111111111",req.body);
          const pipeline = [
            { $match: { orderId: req.body.orderId } },
            {$unwind:"$orderItem"},
            
          ];
          
          const order = await Order.aggregate(pipeline);
          const orderr= await Order.find({orderId: req.body.orderId })
          //console.log("hello",orderr[0].orderItems[0].orderStatus);
          if (orderr.length > 0) {
            const currentStatus = orderr[0].orderItem[0].orderStatus;
          
            let updateStatus;
            let newStatus;
          
            if (currentStatus === "pending") {
              updateStatus = "processing";
              newStatus = "processing";
            } else if (currentStatus === "processing") {
              updateStatus = "delivered";
              newStatus = "delivered";
            
              
            }else{
              updateStatus="cancel"
              newStatus="cancel"
            }
          
            if (updateStatus) {
              
              const pipeline=[
                {$match:{orderId:req.body.orderId}},
                {$unwind:"$orderItem"},
                {
                  $addFields:{
                    "orderItem.updatedField":updateStatus,
                  }
                },
                
              ]
           
    
              const updatedOrder= await Order.findOneAndUpdate(
                {orderId:req.body.orderId},
                {$set:{"orderItem.0.orderStatus":updateStatus}}
              )
              console.log(" updatedOrder---->", updatedOrder)
              res.send({ status: updateStatus });
            } else {
              res.send({ status: currentStatus });
            }
          } else {
            res.status(404).send({ error: "Order not found" });
          }
          
          
        }catch(err){
            console.error("postOrderUpdate",err.message);
        }
    }
    
    module.exports.getOrderDetails=async(req,res)=>{
        try{
          console.log("......................................................",req.query);
            
            const order= await Order.findOne({orderId:req.query.id})
            const pipeline = [
              {
                $lookup: {
                  from: 'users', // Replace with your actual collection name for users
                  localField: 'user',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              {
                $unwind: '$user'
              },
              {
                $unwind: '$orderItem'
              },
              {
                $lookup:{
                  from:'products',
                  localField:'product_id',
                  foreignField:'_id',
                  as:'product'
                }
              },
              {
                $unwind: '$product'
              },
    
            ];
            const orderList = await Order.aggregate(pipeline);
             //console.log("order list  -------------->",order);
            if (order) {
          const user = await User.findOne({ _id: order.user });
         let orderDetails=[]
         let orders={ address:order.address,
          name:user.name,
          orderStatus:order.orderItem[0].orderStatus,
          totalAmount:order.totalAmount,
          purchaseDate:order.purchaseDate,
          deliveryDate:order.deliveryDate,
          paymentMethod:order.paymentMethod}
          orderDetails.push(orders)
        const id =order.orderItem[0].product_id
          const product = await Products.findOne({ _id:id }); 
          //console.log("product............",product);
          if (product) {
           
            const orderDetail = {
    
              productName: product.productName,
              quantity: order.orderItem[0].quantity
    
          };
          orderDetails.push(orderDetail);
              // console.log(`Product Name: ${product.productName}, Quantity: ${orderItem.quantity}`);
          
      }
      console.log("orderDetails.........................@@@@@@@@@@...........................",orderDetails);
      res.render('orderDetails',{orderDetails})
    } else {
        console.log("Order not found");
    }
    
    
    
    
        }catch(err){
            console.error("postOrderUpdate",err.message);
        }
    }
    
    module.exports.postCancelOrder = async (req, res) => {
      try {
        const orderId = req.body.orderId;
        const cancelableStatuses = ["pending", "processing"];
    
        const order = await Order.findOne({ orderId });
    
        if (!order) {
          return res.send({ message: "Order not found" });
        }
    
        if (!cancelableStatuses.includes(order.orderStatus)) {
          return res.send({status:"delivered", message: "Cannot cancel order with current status" });
        }
    
        const updatedOrder = await Order.findOneAndUpdate(
          { orderId },
          { $set: { orderStatus: "cancel" } }
          
        );
    
        res.send({ status: "cancel", message:"Order cancelled" });
      } catch (err) {
        console.error(" ------>postCancelOrder<------", err.message);
        res.status(500).send({ status: "Error occurred while canceling order" });
      }
    };

    module.exports.paginate = async (req,res)=>{
      console.log("req.query>>",req.query.count);
      if(req.query.count){
        const countPage = await Order.find(req.body.query).count();
        const count = ceil(countPage/8);
        console.log("countPage>>",countPage)
        res.json(count)
      }else{
        const orderdata = await Order.find(req.body.query).sort({createdAt:-1}).limit(req.body.limit).skip(req.body.skip);
        res.send(orderdata)
      }
    }
    module.exports.getSearch = async(req,res)=>{
      const searchQuery = new RegExp("^" + req.body.search, "i"); // Adding "i" flag for case-insensitive search
  
      User.find({ name: { $regex: searchQuery } }).then((users) => {
        if (users.length === 0) {
          const itemsPerPage = 6; // Set the desired number of items per page
              const currentPage = req.query.page ? parseInt(req.query.page) : 1;
              const totalItems = users.length;
              const totalPages = Math.ceil(totalItems / itemsPerPage);
              
              // Calculate the startIndex and endIndex to load exactly 'itemsPerPage' items
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              
              // Slice the array to get items for the current page, ensuring 'itemsPerPage' items
              const itemsToShow = users.slice(startIndex, endIndex);
          res.render('usersListAdmin', { users: [],items: itemsToShow,
            totalPages: totalPages,
            currentPage: currentPage, });
        } else {
          const itemsPerPage = 6; // Set the desired number of items per page
          const currentPage = req.query.page ? parseInt(req.query.page) : 1;
          const totalItems = users.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          
          // Calculate the startIndex and endIndex to load exactly 'itemsPerPage' items
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          
          // Slice the array to get items for the current page, ensuring 'itemsPerPage' items
          const itemsToShow = users.slice(startIndex, endIndex);
      res.render('usersListAdmin', { users,items: itemsToShow,
        totalPages: totalPages,
        currentPage: currentPage, });
        }
      });
    
  }
  module.exports.postGraph=async(req,res)=>{
    try{
        console.log("***********",req.body);
    }catch(err){
        console.error("postGraph====>",err.message);
    }
}

module.exports.postConforming=async(req,res)=>{
try{console.log("................................................................11111111111111111111111111")
  const orderId=req.body.orderId;
  const order=await Order.findOne({orderId:orderId})
  const product=order.forEach(item=>{item.product_id})
  const orderr=await Order.findOneAndUpdate({productId:product},{$set:{orderConfirm:true}})
console.log(order)
}catch(e){
console.log("postConforming order adminside",e.message)
}
}
    module.exports.getLogout = async (req, res) => {
  
      req.session.admin =""
      console.log("destroyed")
      res.redirect('/admin')
    }

    module.exports.getReturn = async(req,res)=>{
      try{
        const order = await Order.findOne({orderId:req.query.orderId})
        console.log(order);
        console.log(req.query);
        const orderId=req.query.orderId
        const pipeline = [
          {$match:{
                orderId
              }},
          {
          
            $lookup: {
              from: 'users', // Replace with your actual collection name for users
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $unwind: '$orderItem'
          },
          
          {
            $lookup: {
              from: 'products', // Replace with the actual collection name for products
              localField: 'orderItem.product_id',
              foreignField: '_id',
              as: 'orderItem.product'
            }
          },
          {
            $group: {
              _id: '$orderId', // Group by orderId to eliminate duplicates
              user: { $first: '$user' },
              orderId: { $first: '$orderId' },
              orderItem: { $push: '$orderItem' }, // Keep the original orderItems array
              totalAmount: { $first: '$totalAmount' },
              purchaseDate: { $first: '$purchaseDate' },
              deliveryDate: { $first: '$deliveryDate' },
              paymentMethod: { $first: '$paymentMethod' },
              address:{$first: '$address' }
            }
          },
          {
            $project: {
              _id: 0,
              user: 1,
              orderId: 1,
              orderItem: 1,
              totalAmount: 1,
              purchaseDate: 1,
              deliveryDate: 1,
              paymentMethod: 1,
              address:1,
            }
          }
        ];
           
      const orderLists = await Order.aggregate(pipeline);
      console.log("******",orderLists[0].orderItems);
      const orderItems=orderLists[0].orderItems
      const user = await User.findOne({email:req.session.userId})
      res.render('return',{orderItems,user})
      }catch(err){
        console.error("getReturn error ----->",err.message);
      }
    }