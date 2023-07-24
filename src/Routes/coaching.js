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

router.post('/addFeedback', async (req, res) => {
    console.log(req.body);
    const { email,userId,feedback } = req.body;
    if(!email || !userId || !feedback){
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
    const userF = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    if(!userF){
        return res.json({message: 'User not found',status:false});
    }
    if(user.role !== 'ADMIN'){
        return res.json({message: 'Only admin can add feedback',status:false});
    }
    if(user.companyId !== userF.companyId){
        return res.json({message: 'Not admin of users company',status:false});
    }
    const feedbackCreate = await prisma.feedback.create({
        data: {
            userId: userId,
            feedback: feedback
        }
    });
    console.log(feedbackCreate);
    if(!feedbackCreate){
        return res.json({message: 'Feedback not added',status:false});
    }
    return res.json({message: 'Success',status:true});
});
module.exports = router;