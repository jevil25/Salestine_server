const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  try {
    const { email, meetId, dealId } = req.body;
    if (!email && !meetId && !dealId) {
      res.status(400).json({ Error: "Missing information" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if(!user){
        res.status(400).json({Error:"User not found"})
    }
    const data = await prisma.deals.findMany({
      where: { userId: user.id },
    });
    console.log(data[0].data);
    if(!data){
        res.status(400).json({Error:"Deals not found"})
    }
    const deal_arr = await data[0].data.data;
    // res.status(200).json({deal_arr})
    console.log(deal_arr)
    const deal = deal_arr.find((obj)=>obj.id==dealId)
    const dealIndex = deal_arr.findIndex((obj)=>obj.id == dealId)
    if(!deal){
        res.status(400).json({Error:"Deal not found"});
    } 
    console.log(deal)
    if(deal.meetId){
        console.log("MEETID PRESENT")
        deal.meetId = [...deal.meetId,meetId]
    }
    else{
        console.log("meet absent")
        let meet_arr = [meetId];
        deal.meetId = meet_arr
    }
    deal_arr[dealIndex] = deal;

    const deal_update = await prisma.deals.updateMany({
        where:{userId:user.id},
        data: {data:deal_arr},
    })

    res.status(200).json({Success:true,data,deal_update})
  } catch (err) {
    res.status(400).json({ Error: err });
  }
}

module.exports = handler;
