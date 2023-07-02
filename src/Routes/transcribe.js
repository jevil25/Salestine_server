const prisma = require("../utils/db/prisma");

async function transcribe(req, res) {
  const { meet_id } = req.body;
  if(!meet_id){
    return res.status(400).json({ error: "Please provide meet_id" });
  }
  const meet = await prisma.transcript.findMany({
    where: {
      meetingId: meet_id,
    },
  });
  if(!meet){
    return res.status(400).json({ error: "No such meeting found" });
  }
  res.status(200).json({
    message: "success",
    data: meet,
  });
}

module.exports = transcribe;