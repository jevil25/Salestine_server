const express = require("express");
const router = express.Router();
const User = require("../models/User")


router.post("/register",async (req, res) => {
    console.log("Inside route code")
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }
      const { name, email, password } = req.body;
 
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      try {
        User.create({
            username: name,
            email: email,
            password: password,
            provider: "salesine"
        }).then((user) => {
            console.log(user)
        }).catch((err) => {
            console.log(err)
        })
        res.json({ success: true,email:email });
      } catch {
        res.json({ success: false });
      }
    }
  );

module.exports = router