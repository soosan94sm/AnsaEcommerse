const twilio = require('twilio');
const crypto=require("crypto")
require('dotenv').config()
const User = require("../models/userModels")
//twilio credentials
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = twilio(accountSid, authToken);


//for otp generation
const generateOTP=()=>{
  const otpLength=6;
 // Generate a random number between 10^5 (100,000) and 10^6 (1,000,000)
 const otp = crypto.randomInt(Math.pow(10,otpLength-1),Math.pow(10,otpLength))
 return otp.toString()
}  


//to send otp to user
module.exports.sendOTP=async (phone)=>{

  const otp=generateOTP();//involking otp generator  
  console.log("otp generate >", otp);
  const message = `Your OTP is ${otp}. Please use it to complete your signup`;
  const data = await User.updateOne({phone:phone},{$set:{otp:otp}})
  console.log("otp user....",data)
  //to send otp using twilio
    // client.messages
    // .create({
    //   body: message,
    //   to: `+91${phone}`,
    //   from: '+14704666468',
    // })
    // .then(async (message) => {
    //   try{
    //     const data = await User.updateOne({phone:phone},{$set:{otp:otp}})
    //     req.app.locals.phone = phone;
    //   }catch(err){
    //     console.log("in otp module>>",err.message);
    //   }
      
    //   return 1;
    // })
    // .catch(error=>{
     
    //   console.log("Error sending OTP:",error.message)
    //   return 0;
    // })
        
}