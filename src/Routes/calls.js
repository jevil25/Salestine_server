const prisma = require("../utils/db/prisma");

async function handler(req, res) {
    const { email } = req.body;
    if(!email){
        return res.status(404).json({ message: "Email not found.",status: false });
    }
    //include only meetings with recording_drive_link
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    const meetings = await prisma.meeting.findMany({
        where: {
            meetHostId: user.id,
        },
    });
    if (meetings) {
        const meetingsWithRecording = meetings.filter((meeting) => meeting.recordingLink !== null);
        console.log(meetingsWithRecording);
        res.status(200).json(meetingsWithRecording);
    } else {
        console.log("User not found.");
        res.status(404).json({ message: "User not found." });
    }
}

module.exports = handler;