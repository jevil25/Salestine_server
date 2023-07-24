const express = require('express');
const router = express.Router();
const prisma = require('../utils/db/prisma');

router.post('/', async (req, res) => {
    console.log(req.body);
    const email = req.body.email;
    console.log(email);
    if(!email){
        console.log('email is required');
        return res.json({message: 'Email is required',status:false});
    }
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    if(!user){
        return res.json({message: 'User not found',status:false});
    }
    const company = await prisma.company.findUnique({
        where: {
            id: user.companyId
        },
        select: {
            users: {
                include: {
                    analysis: true,
                    deals: true,
                    meeting: true,
                    feedback: true,
                }
            }
        }
    });
    console.log(company);
    if(!company){
        return res.json({message: 'Company not found',status:false});
    }
    return res.json({message: 'Success',status:true,data:company});
});

module.exports = router;