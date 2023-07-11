const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  let { email } = req.body;
  // const audio_data = req.file
  const audio_data = new Blob([JSON.stringify(req.file)], {
    type: "audio/wav",
  });
  console.log(typeof audio_data);
  if (!email || !audio_data) {
    return res.status(400).json({ message: "Missing data!" });
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });
    if (!user) {
      console.log("user not found");
      return res.status(401).json({ message: "Un-registered Email" });
    }
    const formData = new FormData();
    formData.append("audio_data", audio_data, "audio.wav");
    formData.append("speaker_name", user.id);
    await fetch("http://18.190.131.83:5555/speaker_enroll/", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then(async (info) => {
        console.log(info)
        await prisma.user.update({
          where: { email },
          data: {
            voice_rec: "stored",
          },
        });
        res
          .status(200)
          .json({ message: "Voice endpoint completed", user, info });
      });
  } catch (err) {
    console.log("Internal Server Error: " + err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = handler;
