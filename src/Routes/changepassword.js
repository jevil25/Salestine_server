const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body);
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { email, oldpassword, newpassword } = req.body;
  if (!email || !oldpassword || !newpassword) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });
    if (!user) {
      console.log("user not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.password !== oldpassword) {
      console.log("password not matched");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const password_status = "y";
    await prisma.user.update({
      where: { email },
      data: {
        password:  newpassword ,
        password_change:  password_status ,
      },
    });
    res.status(200).json({ message: "Password change successful", user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = handler;
