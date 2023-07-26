const prisma = require("../utils/db/prisma");
const FormData = require('form-data');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const aws = require('aws-sdk');

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  let { meetId,meetPassword,meetDate,meetTime,meetDuration,email,topic } = req.body;
  console.log(req.body);
  const audio_data = req.file;
  console.log(audio_data);
  //the file is in webm format, so we need to convert it to wav
  try{
    fs.writeFileSync("audio_data.mp4", audio_data.buffer);
    //convert to m4a
    ffmpeg("audio_data.mp4").toFormat("mp3").noVideo()
    .save("audio_data.mp3")
    .on("end", async function (err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Internal Server Error",status:false });
        }
        //upload to s3
    aws.config.update({
        region: process.env.REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_ACCESS_SECRET,
      });
    const s3 = new aws.S3();
    console.log("uploading to s3");
    //upload both files
    const param = {
        Bucket: process.env.BUCKET,
        Key: `${meetId}/${meetId}.mp4`,
        Body: fs.createReadStream("audio_data.mp4"),
    }
    s3.upload(param, function(err, data) {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Internal Server Error",status:false });
                }
                console.log(`File uploaded successfully. ${data.Location}`);
                const param2 = {
                    Bucket: process.env.BUCKET,
                    Key: `${meetId}/${meetId}.mp3`,
                    Body: fs.createReadStream("audio_data.mp3"),
                }
                console.log(param2)
                s3.upload(param2, async function(err, data) { 
                        if (err) {
                            return res.status(500).json({ message: "Internal Server Error",status:false });
                        }
                        console.log(`File uploaded successfully. ${data.Location}`);
                        const user = await prisma.user.findUnique({
                            where: { email },
                            });
                        const meet = await prisma.meeting.upsert({
                            where: { meetid:meetId },
                            update: {
                                meetPassword:meetPassword,
                                meetHostId:user.id,
                                awsKey:meetId,
                                duration:parseInt(meetDuration),
                                startTime:meetDate+"T"+meetTime,
                                companyid:user.companyId,
                                topic: topic
                            },
                            create: {
                                meetid:meetId,
                                meetPassword:meetPassword,
                                meetHostId:user.id,
                                awsKey:meetId,
                                duration:parseInt(meetDuration),
                                startTime:meetDate+"T"+meetTime,
                                companyid:user.companyId,
                                topic: topic
                            }
                        });
                        try{
                        res.status(200).json({ message: "upload endpoint completed", meet,status:true });
                        fs.unlinkSync("audio_data.mp4");
                        fs.unlinkSync("audio_data.mp3");
                        }catch(err){
                            console.log(err);
                        }
                        return;
                });
        });
    })
    .on("error", function (err) {
        console.log("error: ", err);
    }).run();
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error",status:false });
  }
}
module.exports = handler;
