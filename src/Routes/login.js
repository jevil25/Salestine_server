const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      });
    if (!user) {
      console.log("user not found")
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.password !== password) {
      console.log("password not matched")
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    user.token = token;
    await prisma.user.update({
      where: { email },
      data: { token },
      });
      console.log("user found")
    res.status(200).json({ message: 'Login successful', user});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = handler;