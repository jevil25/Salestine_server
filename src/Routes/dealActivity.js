const prisma = require("../utils/db/prisma");

async function handler(req,res){
    if(req.method != 'POST'){
        res.status(400).json({error:"Method not allowed"})
    }

    // const deal = 
}

module.exports = handler