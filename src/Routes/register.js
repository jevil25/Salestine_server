const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { name, email, password } = req.body;
 
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        token,
        role: 'USER',
      },
    });
    console.log(user)
    res.status(201).json({ message: 'User registered successfully'});
}

module.exports = handler;