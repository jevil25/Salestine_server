const express = require("express");
const router = express.Router();
const User = require("../models/User")

// router.post("/login",async (req, res) => {

//     let email = req.body.email;

//     try {
//       let userData = await User.findOne({email})
//       if(userData){
//           if(req.body.password == userData.password){
//              return res.json({success:true,message:"Logging in!"})
//           }
//           else{
//             return res.json({success:false,message:"Incorrect password"})
//           }
//       }
//       else{
//           res.status(400).json({errors:"Enter the email!"})
//       }
  
//       res.json({ success: true });
//     } catch {
//       console.log(errors);
//       res.json({ success: false });
//     }
//   }
// );

module.exports = router