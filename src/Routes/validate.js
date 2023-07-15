const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma")

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(401).json({ message: 'Invalid token',status:401 });
    }
    const { token, email } = req.body;
    if (!token || !email) {
        return res.status(401).json({ message: 'Invalid token',status:401 });
    }
    try {
        const result = jwt.verify(token, JWT_SECRET);
        if (result.email !== email) {
            return res.status(401).json({ message: 'Invalid token',status:401 });
        }
        if(result.exp < Date.now() / 1000){
            return res.status(401).json({ message: 'Token expired',status:401 });
        }
        const user = await prisma.user.findUnique({
            where: { email },
            include:{
                meeting:true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found.",status: false });
        }
        res.status(200).json({ message: 'Token verified',status:200, user });
    }
    catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Invalid token',status:401 });
    }
}

module.exports = handler;
