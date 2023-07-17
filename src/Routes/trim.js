const express = require('express');
const router = express.Router();
const prisma = require('../utils/db/prisma');

router.post("/trim",async (req,res)=>{
    const { meetId, startTime,endTime,videoId } = req.body;
    console.log(meetId,startTime,endTime);

    if(!meetId || !startTime || !endTime){
        res.status(400).send({message:"Invalid Request",status:false});
        return;
    }

    const meet = await prisma.meeting.findUnique({
        where:{
            meetid:meetId
        }
    });
    if(!meet){
        res.status(400).send({message:"Invalid MeetId",status:false});
        return;
    }
    const trim = await prisma.trim.create({
        data:{
            startTime:startTime,
            endTime:endTime,
            meetingId:meetId,
            videoId:videoId
        }
    });
    res.status(200).send({message:"Trim Created",trim:trim,status:true});
    return;
});

router.post("/trimData",async (req,res)=>{
    const { id } = req.body;
    console.log(id);

    if(!id){
        res.status(400).send({message:"Invalid Request",status:false});
        return;
    }
    const trim = await prisma.trim.findUnique({
        where:{
            id:id
        }
    });
    console.log(trim);
    if(!trim){
        res.status(400).send({message:"Invalid MeetId",status:false});
        return;
    }
    res.status(200).send({message:"Trim Created",trim:trim,status:true});
    return;
});

module.exports = router;