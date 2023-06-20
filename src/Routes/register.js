const express = require("express");
const router = express.Router();
const User = require("../models/User")
const prisma = require("../utils/db/prisma");


router.post("/register",async (req, res) => {
    console.log("Inside route code")
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }
      const { name, email, password } = req.body;
 
      const existingUser = await prisma.user.findUniqueOrThrow({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      try {
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password,
            role: "ADMIN",
            token: "ksjdsjkdbjdjsjd",
            companyId: '1'
          },
        });
        res.json({ success: true,email:email });
      } catch {
        res.json({ success: false });
      }
    }
  );

module.exports = router