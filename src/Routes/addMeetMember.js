const express = require('express');
const router = express.Router();
const prisma = require('../utils/db/prisma');

router.post('/', async (req, res) => {
    console.log(req.body);
    const { meetid, name, role } = req.body;
    try {
        const member = await prisma.member.create({
            data: {
                name:name,
                role:role,
                meetId:meetid,
            }
        });
        res.json({ member ,status:true});
    }
    catch (err) {
        console.log(err);
        res.json(err);
    }
});

module.exports = router;