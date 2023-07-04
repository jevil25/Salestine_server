const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req,res){
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
      }
    let {email} = req.body;
    if(!email){
        res.status(400).json({message:"Email not received"})
    }
    try{
        const user = await prisma.user.findUniqueOrThrow({
            where: { email },
          });
          if (!user) {
            console.log("user not found");
            return res.status(401).json({ message: "Un-registered Email" });
          }
          await prisma.user.update({
            where: { email },
            data: {
              voice_rec:"stored"
            },
          });
          res.status(200).json({ message: "Voice registration completed", user });
    }
    catch(err){
        console.log("Internal Server Error: " + err)
    }
}
module.exports = handler;
