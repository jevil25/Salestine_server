const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const prisma = require("../utils/db/prisma");
const handler = require('../utils/google/getAccessToken');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


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
          fs.unlinkSync(`${rid}.m4a`);
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

async function diarizer(req, res) {
  try{
    //gets meets without transcriptionCompleted field doesnt exsist
    const meets = await prisma.meeting.findMany({
      where: {
        NOT: {
          recordingLink: null,
          transcriptionComplete: true,
        },
      }
    });
    console.log(meets);
    meets.map(async (meet) => {
      const { id, recordingLink,numberOfSpeakers } = meet;
      const accessToken = await(handler(process.env.DRIVE_EMAIL));
      //get id from recordingLink
      // const rid = recordingLink.split('d/')[1].split('/')[0];
      // // const rid ="1QihwDMxSXfmY8HFU42JmlX_srNmtr_W3"k
      // console.log(rid);
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
      .then(data => {
        //check if file is audio file name starts with audio
        const audioFile = data.files.filter(file => file.name.startsWith('audio'))[0].id;
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
              url: 'http://18.190.131.83:5555/diarizer/',
              headers: { 
                ...data.getHeaders()
              },
              data : data
            };
          
            console.log("Sending data to asr")
            const response =  await fetch(config.url, {
                method: config.method,
                headers:{
                  ...data.getHeaders()
                },
                body: data
            });
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
          res.send(json)
          }
          else{
            res.send(err)
          }
        });
      })
      }
    )
  }catch(err){
    console.log(err);
    res.send(err);
  }
}

module.exports = diarizer;