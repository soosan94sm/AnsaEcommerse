const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Products = require("../models/productModel");
const User = require("../models/userModels");
const Razorpay = require('razorpay')
const { v4: uuidv4 } = require('uuid');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY
})
function generateShortUUID() {
  const uuid = uuidv4().split('-')[0]; // Get the first part of the UUID
  const shortUUID = '0'+ uuid.slice(0, 4); // Take the first 4 characters and prepend #
  return shortUUID;
}
const userUtils=require("../utils/userUtils")
//to encrypt password
const securePassword = async (pass) => {
  try {
    const passHash = await bcrypt.hash(pass, 10)
    return passHash
  } catch (e) {
    console.log("password err", e.message);
  }
}
module.exports.getOrders = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.userId });
       const pipeline = [
      {
        $match: {
          user: user._id,
        },
      },
      {
        $lookup: {
          from: 'users', // Replace with your actual collection name for users
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
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
      }, {
        $group: {
          _id: '$orderId', // Group by orderId to eliminate duplicates
          user: { $first: '$user' },
          orderId: { $first: '$orderId' },
          orderItem: { $push: '$orderItem' }, // Keep the original orderItems array
          totalAmount: { $first: '$totalAmount' },
          purchaseDate: { $first: '$purchaseDate' },
          deliveryDate: { $first: '$deliveryDate' },
          paymentMethod: { $first: '$paymentMethod' },
          address: { $first: '$address' }
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
          address: 1,
        }
      },

      {
        $sort: { purchaseDate: -1 }, // Sort by purchaseDate in descending order
      },
    ];

    const orderLists = await Order.aggregate(pipeline);

    orderLists.forEach(item => {
      console.log("*************",item)
    })
    const order1 = await Order.findOne({ user: user._id })


    //console.log("#####################");
    console.log('ORDER LIST',orderLists);
    //console.log("#####################");
    const innerArrays = orderLists.map((item) => {
      console.log("........item", item.orderItem)
      item.orderItem.forEach(items => { console.log("11111111111", items.product) })
    });
    // i need product details, order detail
    //console.log("#####################");
    console.log('ORDER LIST', order1);
    console.log("#####################", orderLists);
    const productDetails = [];

    const itemsPerPage = 2;
    const totalItems = orderLists.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = orderLists.slice(startIndex, endIndex);

    const innerArrayss = itemsToShow.map(item => item.orderItem);
    const ans=  innerArrayss.map(item=>{
    return item 
    })
    console.log("ans ",ans);

    res.render('orders', { user: user, orderItems: orderLists, productDetail: innerArrays,totalPages: totalPages,
      currentPage: currentPage, });

  } catch (err) {
    console.error("getOrders", err.message);
  }
};



module.exports.postVerifyPayment = async (req, res) => {
  const paymentResponse = req.body;
  console.log("paymentResponse...........", paymentResponse)
  // Verify the payment response using Razorpay API or your preferred method
  // For simplicity, you can compare paymentResponse.razorpay_order_id and paymentResponse.razorpay_payment_id

  // if (/* Payment verification logic */) {
  //   return res.status(200).json({ success: true });
  // } else {
  //   return res.status(400).json({ success: false });
  if (
      paymentResponse.razorpay_order_id &&
      paymentResponse.razorpay_payment_id
    ) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false });
    }
  
}


module.exports.postCreateOrder = async (req, res) => {
  console.log(req.body);

  const orderAmount = req.body.total * 100   // Amount in paise (1 INR = 100 paise)
  console.log(orderAmount);
  const options = {
    amount: orderAmount,
    currency: 'INR',
    receipt: 'order_receipt',
    payment_capture: 1,
  };

  razorpay.orders.create(options, (err, order) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ error: 'Failed to create order' });
    } else {
      res.json(order);
    }
  });
}
module.exports.productCancel = async (req, res) => {
  try {
    const orderId = req.body.orderId
    const orderItemId = req.body.orderItemId
    const cancelReason = req.body.cancelReason
    const productId = req.body.productId
    const quantity = req.body.quantity
     console.log(productId);
    let product
    if (cancelReason !== 'damaged') {
      product = await Products.findOneAndUpdate({ _id: productId }, { $inc: { stock: req.body.quantity } })
    }
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.body.orderId },
      { $set: { "orderItem.0.orderStatus": "cancel"}},{"orderItem.0.orderCancleRequest":true }
    )

    let amount = quantity * product.price
    const user = await User.findOneAndUpdate({ email: req.session.userId }, { $inc: { wallet: amount } },)

console.log(updatedOrder)
    console.log("****************");
    // console.log(updatedOrder);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("productCancel error ----> ", err.message);
  }

}
module.exports.getProductCancel = async (req, res) => {
  try {
    console.log(req.query);
    const orderId = req.query.orderId
    const orderItemId = req.query.id

    const pipeline = [
      {
        $match: {
          orderId
        }
      },
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
        $match: {
          'orderItem.product_id': new mongoose.Types.ObjectId(req.query.id) // Replace 'your_order_item_id_here' with the actual order item ID you want to match
        }
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
          address: { $first: '$address' }
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
          address: 1,
        }
      }
    ];
    const user = await User.findOne({ email: req.session.userId })

    const orderLists = await Order.aggregate(pipeline);
    console.log("%%%%%%%%%%%%5555");
    console.log(orderLists);
    res.render('orderCancel', { orderLists, user })
  } catch (err) {
    console.error("getProductCancel ---->", err.message);
  }
}

module.exports.productCancel=async(req,res)=>{
try{
  const orderId= req.body.orderId
  const orderItemId=req.body.orderItemId
  const cancelReason= req.body.cancelReason
  const productId = req.body.productId
  const quantity = req.body.quantity
   console.log(req.query.id);
  let product
  if(cancelReason !=='damaged'){
   product = await Products.findOneAndUpdate({_id:productId},{$inc:{stock:req.body.quantity}})
      }   
  const updatedOrder= await Order.findOneAndUpdate(
    {orderId:req.body.orderId},
    {$set:{"orderItem.0.orderStatus":"cancel"}}
  )
  let amount = quantity * product.price
  const user = await User.findOneAndUpdate({email:req.session.userId},{ $inc: { wallet: amount } },)


  console.log("****************");
  // console.log(updatedOrder);
  res.status(200).json({ success: true });
}catch(err){
  console.error("productCancel error ----> ",err.message);
}

}

module.exports.getReturn = async(req,res)=>{
try{
  console.log(".......................")

  const order = await Order.findOne({_id:req.query.id})
  console.log(order);
  console.log(req.query);
  const orderId = req.query.orderId
  const orderItemId = req.query.id

  const pipeline = [
    {
      $match: {
        orderId
      }
    },
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
      $match: {
        'orderItem.product_id': new mongoose.Types.ObjectId(req.query.id) // Replace 'your_order_item_id_here' with the actual order item ID you want to match
      }
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
        address: { $first: '$address' }
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
        address: 1,
      }
    }
  ];
  //const user = await User.findOne({ email: req.session.userId })

  const orderLists = await Order.aggregate(pipeline);
console.log("orderLists.........return...........",orderLists)
const updatedOrder = await Order.findOneAndUpdate(
  { orderId: req.body.orderId },
  { $set: { "orderItem.0.orderStatus": "return" }},{"orderItem.0.orderReturnRequest":true}
)
if (orderLists.length === 0) {
  // Handle the case where no data is returned
  console.log("No data found in the aggregation result.");
  return res.status(404).send("Order not found.");
}
console.log("******",orderLists[0].orderItem);
const orderItems=orderLists[0].orderItem
const user = await User.findOne({email:req.session.userId})
res.render('return',{orderItems,user})
console.log("orderLists:",orderLists)
}catch(err){
  console.error("getReturn error ----->",err.message);
}
}
module.exports.productreturn=async(req,res)=>{
try{
console.log("return.................",req.body)
const orderId= req.body.orderId
  const orderItemId=req.body.orderItemId
  const cancelReason= req.body.cancelReason
  const productId = req.body.productId
  const quantity = req.body.quantity
   console.log(req.query.id);
  let product
  if(cancelReason !=='damaged'){
   product = await Products.findOneAndUpdate({_id:productId},{$inc:{stock:req.body.quantity}})
      }   
  const updatedOrder= await Order.findOneAndUpdate(
    {orderId:req.body.orderId},
    {$set:{"orderItem.0.orderStatus":"return"}}
  )
  let amount = quantity * product.price
 
  console.log("****************");
  // console.log(updatedOrder);
  res.status(200).json({ success: true });
}catch(e){
console.log(e.message)
}
}
// module.exports.getOrders = async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.session.userId });
//     const productIds = user.cart.map((item) => item.productId);

//     const productDetails = await Products.find({ _id: { $in: productIds } });

//     let total = 0;
//     user.cart.forEach((item) => {
//       const product = productDetails.find((product) => product._id.equals(item.productId));
//       if (product) {
//         total += product.price * item.quantity;
//       }
//     });

//     // Check if user is found
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Create a new order document
//     const order = new Order({
//       user: user._id,
//       address: user.address.items[0]._id,
//       totalAmount: total,
//       orderItem: user.cart.map((item) => ({
//         product_id: item.productId,
//         quantity: item.quantity,
//         price: item.price, // Add the price from the cart item
//       })),
//       // Set other fields as needed
//     });

//     // Save the order to the database
//     const savedOrder = await order.save();

//     res.render('orders', {
//       user: user,
//       orderItems: [savedOrder], // Pass the saved order as an array
//       productDetails: productDetails,
//       total: total, // Pass the total price
//     });

//     // Clear the user's cart after creating the order
//     const cartDelete = await User.updateOne(
//       { _id: user._id }, // Use user's _id to identify the user
//       { $set: { cart: [] } } // Set the cart array to an empty array
//     );

//     console.log("productIds:", cartDelete);
//   } catch (err) {
//     console.error("getOrders", err.message);
//     // Handle the error here
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // const razorpay = new Razorpay({
// //     key_id:process.env.RAZORPAY_ID_KEY,
// //     key_secret:process.env.RAZORPAY_SECRET_KEY
// // })
module.exports.getOrderDetails = async (req, res) => {
  //console.log("order req.query.id", req.query.id);

  try {
    const user = await User.findOne({ email: req.session.userId });
    console.log(".................user", user);
    const order = await Order.findOne({ orderId: req.query.id })

    console.log("222222222222222", order)
    if (!order) {
      console.log("No orders found for the user");
      return res.status(404).json({ message: "No orders found for the user" });
    }

    const orderData = []; // Declare orderData here

    for (const item of order.orderItem) {
      const product = await Products.findOne({ _id: item.product_id });
      //console.log(".................product", product);

      if (product) {
        let total = item.quantity * product.price;
        console.log("total.....",total)
        orderData.push({

          user: user,
          quantity: item.quantity,
          price: product.price, // Add the price from the order item
          product: product,
          total: total,
          order: order,
          orderStatus: item.orderStatus,
          purchaseDate: order.purchaseDate
        });
      }
    }


    console.log("orderData..............222222..............",orderData)
    orderData.map(item=>{console.log("item.product/////////////////////////////////////",item.product.productName);})
    console.log("compler");
    // Render the order details template with the product data
    res.render("orderDetails", { product: orderData,order:order });

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal server error");
  }
};




