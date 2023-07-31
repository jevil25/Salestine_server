const cron = require('node-cron');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const prisma = require("../db/prisma");
const handler = require('../google/getAccessToken');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
let ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe');
ffprobePath = ffprobePath.replace('ffmpeg-installer', 'ffprobe-installer');
ffmpeg.setFfprobePath(ffprobePath);
const aws = require('aws-sdk');

const processFile = async (file) => {
  const { awsKey,meetid:meetingId } = file;
  // console.log(awsKey,meetingId);
  //get file from aws s3 using awsKey
  //update file schema with audio and video keys
  aws.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  });
  const s3 = new aws.S3();
    let r = await s3.listObjects({Bucket: process.env.BUCKET,Prefix: awsKey}).promise();
    //map and check for audio file if file has extension .m4a
    // console.log(r.Contents);
    let audioFile = r.Contents.map((item) => {
      if(item.Key.includes(".m4a") || item.Key.includes(".mp3")){
        return item.Key;
      }
    });
    //get both audio and video file key
    let videoFileKey = r.Contents.map((item) => {
      if(item.Key.includes(".mp4")){
        return item.Key;
      }
    });
    //filter undefined
    audioFile = audioFile.filter((item) => {
      if(item !== undefined){
        return item;
      }
    });
    videoFileKey = videoFileKey.filter((item) => {
      if(item !== undefined){
        return item;
      }
    });
    console.log(audioFile);
    console.log(videoFileKey);
    //update file schema with audio and video keys
    const file1 = await prisma.file.upsert({
        where: {
          meetingId: meetingId,
        },
        create: {
          transcriptionComplete: false,
          videoId: videoFileKey[0],
          meeting: {
            connect: {
              meetid: meetingId,
            }
          }
        },
        update: {
            transcriptionComplete: false,
            videoId: videoFileKey[0],
          },
      });
      // console.log(file1);
};

const runTask = async () => {
  console.log('Running cron job...');

  try {
    // check if awskey is not null and file is not processed
    const files = await prisma.meeting.findMany({
      where: {
        awsKey: {
          not: null,
        },
        file: {
          none:{}
        }
      },
    });

    console.log("uv: ",files);
    if (files.length === 0) {
      console.log('No files to process');
      setTimeout(runTask, 1000 * 60 * 5);
    }

    for (const file of files) {
      processFile(file);
    }
  } catch (err) {
    console.log(err);
    runTask();
  }
};

const updateVideofunc = () => {
  // Run the task immediately
  runTask();

  //run every 1 min
  cron.schedule('*/1 * * * *', () => {
    runTask();
  })
};

module.exports = updateVideofunc;
