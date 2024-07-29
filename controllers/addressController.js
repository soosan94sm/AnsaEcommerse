
const User = require("../models/userModels");
const mongoose = require('mongoose')

module.exports.getAddress = async(req,res)=>{
    try{
        const user = await User.findOne({email:req.session.userId})
        console.log(user.address.items, ' is theaddresss');
       res.render('useraddress',{user:user,addressList:user.address.items})
    }catch(err){
        console.error("getaddress",err.message);
    }
}




module.exports.postAddress=async(req,res)=>{
    try{
      //console.log("fdxcdzhzgxc...........................")
        console.log(req.body);

        if(req.session.userId){
            const addressData= {
                name: req.body.name,
                phone:Number(req.body.phone),
                houseNumber:req.body.houseNumber,
                pincode:Number(req.body.pincode),
                address:req.body.address,
                city:req.body.city,
                state:req.body.state,
                landmark:req.body.landmark,
                alternatePhone:Number(req.body.altPhone)
            }
            console.log("aaaaaaaaaaaaaaaaaaaaaaaaa",addressData)
            const userdata = await User.findOneAndUpdate({email:req.session.userId}, {$push: {"address.items":  addressData}});
            // const address = userdata.address.items;
            // address.push(addressData);
            // await userdata.save();
            // console.log("vvvvvvvvvvv",address)
            if("/checkout"){
            
              res.redirect('/checkout')
            }else{
            res.redirect('/profile/address')
          }
   } }catch(err){
        console.error("postAddress",err.message);
    }
}



module.exports.getEditAddress = async (req, res) => {
    try {
        const id =  req.query.id
     console.log(",,,,,,,,,,,,,,,,,,,",id)
        
        const user = await User.findOne({email:req.session.userId})
        const address=user.address.items
      
  
      // Execute the aggregation pipeline using the User model
     // const address = await User.aggregate(aggregationPipeline);
  
    //   console.log(address);
      const foundObject = address.find(obj => obj._id.toString() === id);
      if (foundObject) {
         console.log("Found Object:", foundObject);
        res.render('editAddress', { user: user ,address:foundObject,id:id});
      } else {
        console.log("Object with the specified _id not found.");
      }
      // Fetch the user document from the 'User' collection
     
  
      // Render the 'editAddress' view template and pass the 'user' object as data
      
    } catch (err) {
      console.error("getEditAddress --> ", err.message);
      // Handle the error and send an appropriate response to the client
      res.status(500).send('Internal Server Error');
    }
  };
 
  module.exports.postEditAddress = async(req,res)=>{
    try{
      if(req.session.userId){
        const addressData= {
            name: req.body.name,
            phone:Number(req.body.phone),
            houseNumber:req.body.houseNumber,
            pincode:Number(req.body.pincode),
           address:req.body.address,
            city:req.body.city,
            state:req.body.state,
            landmark:req.body.landmark,
            alternatePhone:Number(req.body.altPhone)
        }
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaa",addressData)
       
        const userdata = await User.findOneAndUpdate({email:req.session.userId, "address.items._id": req.body.id },{$set: {"address.items.$":addressData}});
        const address = userdata.address.items;
        console.log("address",address)
       
      console.log("userdatas",userdata)
       
        
        res.redirect('/profile/address')
    }
      
    }catch(err){
        console.error("postEditAddress --->",err.message);
    }
  }
  module.exports.postEditAddcheck = async(req,res)=>{
    try{
      if(req.session.userId){
        const addressData= {
            name: req.body.name,
            phone:Number(req.body.phone),
            houseNumber:req.body.houseNumber,
            pincode:Number(req.body.pincode),
           address:req.body.address,
            city:req.body.city,
            state:req.body.state,
            landmark:req.body.landmark,
            alternatePhone:Number(req.body.altPhone)
        }
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaa",addressData)
       
        const userdata = await User.findOneAndUpdate({email:req.session.userId, "address.items._id": req.body.id },{$set: {"address.items.$":addressData}});
        const address = userdata.address.items;
        console.log("address",address)
       
      console.log("userdatas",userdata)
       
        
        res.redirect('/checkout')
    }
      
    }catch(err){
        console.error("postEditAddress --->",err.message);
    }
  }
  module.exports.deleteAddress=async(req,res)=>{
try{
    const id= req.query.id
    console.log("delete id...............",id);
    const user = await User.findOne({email:req.session.userId})
    console.log(user)
    if (user) {
        // Use the filter method to create a new array without the object that matches the id
        user.address.items = user.address.items.filter((item) => item.id !== id);
      console.log("---deleteaddressis :",user.address.items)
        // Save the updated user with the modified address array
        await user.save();

        
    }else {
        console.log("User not found."); // Add this line for debugging
      }
  
    res.redirect('/profile/address')
}catch(err){
    console.error("deleteAddress--->",err.message);
}
  }
  module.exports.addAddress=async(req,res)=>{
    try{
        
 res.render("addAddress")
    }
    catch(err){
        console.log(err.message)
    }}
    module.exports.postaddAddress=async(req,res)=>{
try{
    const email=req.body
    console.log(email)
    const user=await User.find({email:req.session.userId})
    console.log(user)
}catch(err){
console.log("postaddress",err.message)
}
    }