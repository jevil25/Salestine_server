const express = require("express");
const router = express.Router();
const prisma = require("../utils/db/prisma");

router.post("/", async (req, res) => {
    const { meetid } = req.body;

    if(!meetid){
        return res.status(400).json({ message: "Invalid Request",status:false });
    }
    const meet = await prisma.meeting.findUnique({
        where: { meetid },
    });
    if(!meet){
        return res.status(400).json({ message: "Invalid Request",status:false });
    }
    const deleteMeet = await prisma.meeting.delete({
        where: { meetid },
        include: {
            analysis: true,
            comments: true,
            file: true,
            transcript: true,
            trim: true,
        },
    });
    await prisma.file.delete({
        where: { meetingId: meetid },
    });
    await prisma.transcript.deleteMany({
        where: { meetingId: meetid },
    });
    await prisma.trim.deleteMany({
        where: { meetingId: meetid },
    });
    await prisma.analysis.deleteMany({
        where: { meetingId: meetid },
    });
    await prisma.comments.deleteMany({
        where: { meetid },
    });
    console.log(deleteMeet);
    if(!deleteMeet){
        return res.status(400).json({ message: "Invalid Request",status:false });
    }
    return res.status(200).json({ message: "Meet Deleted",status:true });
});

module.exports = router;