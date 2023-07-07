const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body);
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      console.log("user not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.password !== password) {
      console.log("password not matched");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
    user.token = token;
    await prisma.user.update({
      where: { email },
      data: { token },
    });

    if(user.role === "SUPERADMIN"){
      return res.status(200).json({ message: "Login successful", user });
    }
    else if (user.voice_rec === "" && user.password_change === "" && user.googleCalendar === "") {
      return res.status(400).json({ message: "Voice rec ,password change and google calendar integration needed",user });
    }
    else if(user.googleCalendar === "" && user.password_change === ""){
      return res.status(400).json({ message: "Google calendar and password change needed",user });
    }
    else if(user.googleCalendar === "" && user.voice_rec === ""){
      return res.status(400).json({ message: "Google calendar and voice registration needed",user });
    }
    else if(user.password_change === "" && user.voice_rec===""){
      return res.status(400).json({ message: "Password change and voice registration needed",user });
    }
    else if( user.password_change === ""){
      return res.status(400).json({ message: "Password change needed",user });
    }
    else if(user.voice_rec === ""){
      return res.status(400).json({ message: "Voice rec needed",user });
    }
    else if(user.googleCalendar === ""){
      return res.status(400).json({ message: "Google calendar needed",user });
    }
    else{
    console.log("user found");
    res.status(200).json({ message: "Login successful", user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = handler;
