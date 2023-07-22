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
    videoFileKey = videoFileKey.filter((item) => {
      if(item !== undefined){
        return item;
      }
    });
    console.log(audioFile);
    console.log(videoFileKey);
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
        ffmpeg(`./${item}`).output(`./${item.split(".")[0]}.wav`).on('end', async () => {
          console.log("conversion done");
          //delete m4a file
          fs.unlinkSync(`./${item}`);
          const data = new FormData();
        data.append('audio_data', fs.createReadStream(`./${item.split(".")[0]}.wav`));
        data.append('num_speaker', 1);
          
        try{
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
          //use axios
        const response = await axios(config);
    
        console.log(response.data);
    
        if (response.status!==200) {
          fs.unlinkSync(`./${item.split(".")[0]}.wav`);
          throw new Error('Failed to upload the converted file.');
        }
    
        console.log("Waiting for response from ASR");
        const json = await response.data;
    
        //delete wav file
        fs.unlinkSync(`./${item.split(".")[0]}.wav`);
        // if(json.status === false){
        //   return false;
        // }
    
        console.log(json);
        json.data.map(async (item) => {
          item = JSON.parse(item);
          console.log(item);
          item.map(async (item) => {
            let speaker = item.speaker;
            let start_time = item.start_time.toString();
            let end_time = item.end_time.toString();
            let text = item.text;
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
            console.log(transcript);
          });
          const file = await prisma.file.upsert({
            where: {
              meetingId: meetingId,
            },
            create: {
              transcriptionComplete: true,
              diarizerText: json.data[0],
              videoId: videoFileKey[0],
              meeting: {
                connect: {
                  meetid: meetingId,
                }
              }
            },
            update: {
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
          console.log(data);
          if(data.status === false){
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

        //summarization
        console.log("Sending data to summarization");
        const text = await prisma.transcript.findMany({
          where: {
              meetingId: meetingId
          },
          select: {
              speaker: true,
              text: true
            }
        });

        //make msg into a string
        let msg1 = "";
        for(let i = 0; i < text.length; i++){
            msg1 += "speaker" + text[i].speaker + ": " + text[i].text + "\n";
        }
        query({"inputs": msg1}).then(async (response) => {
            if(response[0].summary_text){
                const summary = response[0].summary_text;
                const file = await prisma.file.update({
                    where: {
                        meetingId: meetingId
                    },
                    data: {
                        summary: summary,
                        summaryComplete: true
                    }
                });
                console.log(file);
            }
        });
        //tracker
        async function queryTracker(data) {
          const response = await fetch(
              "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
              {
                  headers: { Authorization: `Bearer ${process.env.summarization_token}` },
                  method: "POST",
                  body: JSON.stringify(data),
              }
          );
          const result = await response.json();
          return result;
      }
      const text1 = await prisma.transcript.findMany({
          where: {
              meetingId: meetingId,
          },
          include: {
              meeting: {
                  select: {
                      companyid: true,
                  }
              }
          }
        });
      //make msg into a string
      let onlyText = "";
      for(let i = 0; i < text1.length; i++){
          onlyText += text1[i].text + "\n";
      }
      //get tracker name from company id
      const tracker = await prisma.tracker.findUnique({
          where:{
              companyId: text1[0].meeting.companyid,
          }
      });
      let labels = [];
      if(!tracker || tracker.trackers.length === 0){
          labels = ["Revisit","Positive_Feedback","Pain_Points","Timeline","Lead_Source","Budget","Upsell_Opportunity","Virtual_Demonstration","Voicemail","Pricing"] //terms of zoom meets
      }else{
          labels = tracker.trackers;
      }
      queryTracker({"inputs": onlyText, "parameters": {"candidate_labels": labels}}).then(async (response) => {
          // response = JSON.parse(response[0]);
          // console.log(response);
          if(response.error){
            return;
          }
          //get labels
          const labels = response.labels;
          //get scores
          const scores = response.scores;
          //calculate the total score and convert scores to percentage
          let totalScore = scores.reduce((a, b) => a + b, 0);
          for(let i = 0; i < scores.length; i++){
              scores[i] = (scores[i]/totalScore)*100;
          }
          //create a json object with labels and scores
          let responseJson = {};
          for(let i = 0; i < labels.length; i++){
              responseJson[labels[i]] = scores[i];
          }
          // console.log(responseJson);
          //store in file
          const file = await prisma.file.update({
              where: {
                  meetingId: meetingId
              },
              data: {
                  trackerData: responseJson,
                  trackerComplete: true
              }
          });
          // console.log(file);
        });
        runTask();
        }catch(err){
          console.log(err);
          runTask();
        }}
      ).run();
      } catch (err) {
        console.log(err);
        runTask();
      }
    });
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

    console.log(files);
    if (files.length === 0) {
      console.log('No files to process');
      setTimeout(runTask, 1000 * 60 * 5);
    }

    for (const file of files) {
      await processFile(file);
    }
  } catch (err) {
    console.log(err);
    runTask();
  }
};

const awsfunc = () => {
  // Run the task immediately
  runTask();

  //run every 2 hrs
  cron.schedule('0 */2 * * *', () => {
    runTask();
  });
};

module.exports = awsfunc;
