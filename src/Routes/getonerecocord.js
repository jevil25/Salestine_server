const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  const meet_id = req.body.meet_id;
  if (!meet_id) {
    return res.status(404).json({ message: "Meeting id not found.",status: false });
  }
  try {
    const meeting = await prisma.meeting.findUnique({
        where: {
            meetid: meet_id
        },
        include: {
            comments: true,
            file: true,
            transcript: true,
            analysis: true,
        }
    });
    console.log(meeting);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found',status:400 });
    }
    else{
        return res.status(200).json({meeting});
    }
  } catch (error) {
    // Handle any errors that occurred during the operation
    console.error("Error retrieving recordings:", error);
    res.status(500).json({ error: "Failed to retrieve recordings",err:error });
  }
}

module.exports = handler;