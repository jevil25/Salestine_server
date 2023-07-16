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
  // console.log(meetingId);
  //get file from aws s3 using awsKey
  //update file schema with audio and video keys
  aws.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  });
  const s3 = new aws.S3();
    let r = await s3.listObjects({Bucket: process.env.BUCKET,Prefix: awsKey + '/'}).promise();
    //map and check for audio file if file has extension .m4a
    console.log(r.Contents);
    let audioFile = r.Contents.map((item) => {
      if(item.Key.includes(".m4a")){
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
    console.log(audioFile);
    //get the file and store it in local
    audioFile.map(async (item) => {
      const params = {
        Bucket: process.env.BUCKET,
        Key: item,
      };
      console.log("downloading");
      const file = await s3.getObject(params).promise();
      console.log(file);
      console.log("done");
      //store the body in local using fs
      item = item.split("/")[1];
      fs.writeFileSync(`./${item}`, file.Body);
      try {  
        //convert m4a to mp4
        ffmpeg(`./${item}`).output(`./${item.split(".")[0]}.mp4`).on('end', async () => {
          console.log("conversion done");
          //delete m4a file
          fs.unlinkSync(`./${item}`);
          const data = new FormData();
        data.append('audio_data', fs.createReadStream(`./${item}`));
        data.append('num_speaker', 7);
    
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: process.env.ASR_URL,
          headers: {
            ...data.getHeaders(),
          },
          data: data,
        };
    
        console.log("Sending data to ASR");
    
        const response = await fetch(config.url, {
          method: config.method,
          headers: {
            ...data.getHeaders(),
          },
          body: data,
        });
    
        console.log(response);
    
        if (!response.ok) {
          fs.unlinkSync(`./${item}`);
          throw new Error('Failed to upload the converted file.');
        }
    
        console.log("Waiting for response from ASR");
        const json = await response.json();
    
        //delete wav file
        fs.unlinkSync(`./${item}`);
        // if(json.status === false){
        //   return false;
        // }
    
        console.log(json);
        json.data.map(async (item) => {
          item = JSON.parse(item);
          item.map(async (item) => {
            let speaker = item.speaker;
            let start_time = item.start_time.toString();
            let end_time = item.end_time.toString();
            let text = item.text;
            speaker = speaker.split("_")[1];
            speaker = parseInt(speaker);
            
            //store to db
            const transcript = await prisma.transcript.create({
              data: {
                speaker: speaker,
                startTime: start_time,
                endTime: end_time,
                text: text,
                meetingId: meetingId,
              },
            });
          });
          const file = await prisma.file.update({
            where: {
              meetingId: meetingId,
            },
            data: {
              transcriptionComplete: true,
              diarizerText: json.data[0],
              videoId: videoFileKey[0],
            },
          });
          console.log(file);
        });
        const msg = new FormData();
        console.log("analysis request sent")
        msg.append('diar_data', json.data[0]);
        const analy = await fetch(process.env.ANALYZE_URL, {
          method: 'post',
          body: {
            diar_data: msg,
          }
        }).then((res) => res.json()).then(async (data) => {
          // console.log(data);
          if(data.status === false){
            const analy = await prisma.analysis.create({
              data: {
                meetingId: meetingId,
              },
            });
            return false;
          }
          const analysis = data.data;
          analysis.forEach(async (item) => {
            const speakers = Object.keys(item);
            for (const speaker of speakers) {
              const analysisData = item[speaker];
    
              // Extract the values from the analysisData object
              const talkRatio = analysisData.talk_ratio;
              const longestMonologue = analysisData.longest_monologue;
              const longestCustomerStory = analysisData.longest_customer_story;
              const interactivity = analysisData.interactivity;
              const patience = analysisData.patience;
              const question = analysisData.question;
    
              // Store the analysis data in the database
              const analysis = await prisma.analysis.upsert({
                where: {
                  meetingId_speaker: {
                    meetingId: meetingId,
                    speaker: speaker,
                }
                },
                create: {
                  meetingId: meetingId,
                  speaker: speaker,
                  talkRatio: talkRatio,
                  longestMonologue: longestMonologue,
                  longestCustomerStory: longestCustomerStory,
                  Interactivity: interactivity,
                  patience: patience,
                  question: question,
                },
                update: {
                  speaker: speaker,
                  talkRatio: talkRatio,
                  longestMonologue: longestMonologue,
                  longestCustomerStory: longestCustomerStory,
                  Interactivity: interactivity,
                  patience: patience,
                  question: question,
                }
              });
            }
          });
          await prisma.file.update({
            where: {
              meetingId: meetingId,
            },
            data: {
              analysisComplete: true,
            }
          });
        });
        }).run();
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
};

const runTask = async () => {
  console.log('Running cron job...');

  try {
    // Get files where transcriptionComplete is false
    const files = await prisma.meeting.findMany({
      where: {
        awsKey:{
            not: null,
        }
      },
    });

    console.log(files);

    for (const file of files) {
      await processFile(file);
    }
  } catch (err) {
    console.log(err);
  }
};

const awsfunc = () => {
  // Run the task immediately
  runTask();

  // Schedule the task to run every 120 minutes
  cron.schedule('*/180 * * * *', runTask);
};

module.exports = awsfunc;
