const prisma = require("../utils/db/prisma");
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.send("Hello User!");
});

//get meetings of particular user
router.get("/getmeetings", async (req, res) => {
    const { email } = req.body;
    if(!email){
        res.status(404).json({ message: "Email not found." });
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        res.status(404).json({ message: "User not found." });
    }
    const user_id = user.id;
    const meetings = await prisma.meeting.findMany({
        where: { user_id },
    });
    if (!meetings) {
        res.status(404).json({ message: "Meetings not found." });
    }
    res.status(200).json(meetings);
});

//get details of a particular meeting
router.get("/getmeeting", async (req, res) => {
    const { meeting_id } = req.body;
    if(!meeting_id){
        res.status(404).json({ message: "Meeting ID not found." });
    }
    const meeting = await prisma.meeting.findUnique({
        where: { id: meeting_id },
    });
    if (!meeting) {
        res.status(404).json({ message: "Meeting not found." });
    }
    res.status(200).json(meeting);
});

module.exports = router;