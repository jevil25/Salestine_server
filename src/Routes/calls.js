const prisma = require("../utils/db/prisma");

async function handler(req, res) {
    const { email } = req.body;
    //include only meetings with recording_drive_link
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            meetings: {
                where: {
                    recording_drive_link: {
                        not: null
                    }
                }
            }
        }
    });
    if (user) {
        const meetingsWithRecording = user.meetings.filter((meeting) => meeting.recording_drive_link);
        console.log(meetingsWithRecording);
        res.status(200).json(meetingsWithRecording);
    } else {
        console.log("User not found.");
        res.status(404).json({ message: "User not found." });
    }
}

module.exports = handler;