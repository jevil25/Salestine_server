import jwt from 'jsonwebtoken';
const { JWT_SECRET } = process.env;
import UserModel from '../../models/User';
import { Router } from 'express';

export default async function handler(req, res) {
  console.log(req.body)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    user.token = token;
    await user.save();
    res.status(200).json({ message: 'Login successful', user});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
