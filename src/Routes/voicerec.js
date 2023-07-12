const prisma = require("../utils/db/prisma");
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  let { email } = req.body;
  const audio_data = req.file;
  console.log(audio_data);
  //the file is in webm format, so we need to convert it to wav
  try{
    fs.writeFileSync("audio_data.wav", audio_data.buffer);
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error",status:false });
  }
  if (!email || !audio_data) {
    return res.status(400).json({ status:false, message: "Missing data!" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      console.log("user not found");
      return res.status(401).json({ status:false,message: "Un-registered Email" });
    }
    const formData = new FormData();
    formData.append("audio_data", fs.createReadStream("audio_data.wav"));
    formData.append("speaker_name", user.id);
    await fetch("http://18.190.131.83:5555/speaker_enroll/", {
      method: "POST",
      headers: {
        ...formData.getHeaders(),
      },
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
        fs.unlinkSync("audio_data.wav");
        res
          .status(200)
          .json({ message: "Voice endpoint completed", user, info,status:true });
      });
  } catch (err) {
    console.log("Internal Server Error: " + err);
    return res.status(500).json({ message: "Internal Server Error",status:false });
  }
}
module.exports = handler;
