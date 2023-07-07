const cron = require('node-cron');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const prisma = require("../db/prisma");
const handler = require('../google/getAccessToken');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { isNull } = require('util');
ffmpeg.setFfmpegPath(ffmpegPath);

const runTask = async () => {
  // This function will run every 15 minutes
  console.log('Running cron job...');
  async function convert(input, output, rid,accessToken, callback) {
    try {
      // console.log(accessToken);
      console.log("Fetching video from drive");
      axios({
        method: 'GET',
        url: input,
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      })
        .then((response) => {
          console.log(response.status);
          console.log(response.statusText);
          const fileData = Buffer.from(response.data);
          fs.writeFileSync(`${rid}.m4a`, fileData)
          console.log("converting to audio")
          // Pipe the downloaded video to FFmpeg for conversion
          ffmpeg(`${rid}.m4a`)
          .output(output)
          .audioCodec('libmp3lame')
          .on('end', () => {
            console.log('Conversion complete!');
            try{
              fs.unlinkSync(`${rid}.m4a`);
            }catch(err){
              console.log(err);
            }
            callback(null);
          })
          .on('error', (err) => {
            console.error('An error occurred:', err.message);
            callback(err)
          })
          .run();
          //convert to audio wav file
          // console.log("converting to audio")
          // ffmpeg(`${rid}.mp4`).noVideo()
          //   .toFormat('mp3')
          //   .on('error', (err) => {
          //     console.log('An error occurred: ' + err.message);
          //   }
          //   )
          //   .on('end', () => {
          //     console.log('Processing finished !');
          //     //delete mp4 file
          //     fs.unlinkSync(`${rid}.mp4`);
          //     callback(null);
          //   }
          //   )
          //   .saveToFile(output);
        })
        .catch((err) => {
          console.error('Error during download:',err.response.status,err.response.statusText,err.response.headers);
          return callback(err.message);
        });
      }
      catch (err) {
        console.log(err);
      }
  }
  //starts here
  try{
    //gets meets without transcriptionCompleted field doesnt exsist
    let meets = await prisma.meeting.findMany({
      where: {
        NOT: {
          recordingLink: null,
          transcriptionComplete: true,
        },
      }
    });
    //filter meets without recordingLink
    meets = meets.filter(meet => meet.recordingLink !== "");
    console.log(meets);
    meets.map(async (meet) => {
      const update = async () => {
        const { id, recordingLink,numberOfSpeakers } = meet;
      const accessToken = await(handler(process.env.DRIVE_EMAIL));
      const folderId = recordingLink.split('folders/')[1].split('/')[0]; // Extract the folder ID from recordingLink
      console.log(folderId);
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents`; // Construct the URL to fetch the files inside the folder
      fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          }
          })
      .then(response => response.json())
      .then(async data => {
        if(data.files){
        const audioFile = data.files.filter(file => file.name.startsWith('audio'))[0].id;
        const videoFile = data.files.filter(file => file.name.startsWith('video'))[0].id;
        console.log("video",videoFile);
        //store in db
        console.log(id);
        if(videoFile !== undefined || videoFile !== null || videoFile !== "" ){
          const existingMeeting = await prisma.meeting.findUnique({
            where: { id: meet.id },
          });
          console.log("meeting",existingMeeting);
          if (existingMeeting){
            const updatedMeeting = await prisma.meeting.update({
              where: { id: meet.id },
              data: {
                videoLink: videoFile,
                transcriptionComplete: false,
              },
            });
            console.log(meets);
          }
        }
        const rid = audioFile; // Get the ID of the audio file
        // console.log(audioFileId);
      convert(`https://www.googleapis.com/drive/v3/files/${rid}?alt=media`, `./${id}.mp3`,rid,accessToken, async function(err){
        if(!err) {
            console.log('conversion complete');
            let data = new FormData();
            data.append('audio_data', fs.createReadStream(`./${id}.mp3`));
            data.append('num_speaker', 1);
            
            let config = {
              method: 'post',
              maxBodyLength: Infinity,
              url: process.env.ASR_URL,
              headers: { 
                ...data.getHeaders()
              },
              data : data
            };
          
            console.log("Sending data to asr")
            try{
              const response =  await fetch(config.url, {
                  method: config.method,
                  headers:{
                    ...data.getHeaders()
                  },
                  body: data
              });
              console.log(response);
              if (!response.ok) {
                fs.unlinkSync(`./${id}.mp3`);
                throw new Error('Failed to upload the converted file.');
              }
              console.log("waiting from response from asr")
              const json = await response.json();
              //delete wav file
              fs.unlinkSync(`./${rid}.mp3`);
              console.log(json);
              json.data.map((item) => {
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
                    meetingId:id,
                  }
                });
                console.log(transcript);
              });
            });
            }catch(err){
              console.log(err);
            }
          }
          else{
            console.log(err);
          }
        });
      }
      });
      }
      const value = await update();
      }
    )
  }catch(err){
    console.log(err);
  }
};

const job = () => {
// Run the task immediately
runTask();

// Schedule the task to run every  minutes
cron.schedule('*/120 * * * *', runTask);
}

module.exports = job;