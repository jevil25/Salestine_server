const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  // console.log(req.body)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { name, email, password, company_name,company_email,company_details } = req.body;
 
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    const company = await prisma.company.findUnique({
      where: { email: company_email },
    });
    if (company) {
      return res.status(400).json({ message: 'Company already registered' });
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        token,
        role: 'ADMIN',
      },
    });
    // console.log(user)
    //create company with user as admin
    const newCompany = await prisma.company.create({
      data: {
        name: company_name,
        email: company_email,
        details: company_details,
        adminId: user.id,
        users:{
          connect:{
            id:user.id
        }
      },
    }
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyId: newCompany.id,
      }
    });
    res.status(200).json({ message: 'User registered successfully'});
}

module.exports = handler;