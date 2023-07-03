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
  async function convert(input, output, rid, callback) {
    try {
      const accessToken = await(handler(process.env.DRIVE_EMAIL));;
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
          fs.writeFileSync(`${rid}.mp4`, fileData)
          // Pipe the downloaded video to FFmpeg for conversion
          //convert to audio wav file
          console.log("converting to audio")
          ffmpeg(`${rid}.mp4`).noVideo()
            .toFormat('mp3')
            .on('error', (err) => {
              console.log('An error occurred: ' + err.message);
            }
            )
            .on('end', () => {
              console.log('Processing finished !');
              //delete mp4 file
              fs.unlinkSync(`${rid}.mp4`);
              callback(null);
            }
            )
            .saveToFile(output);
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
    //get id from recordingLink
    const rid = recordingLink.split('folders/')[1].split('/')[0];
    // const rid ="1QihwDMxSXfmY8HFU42JmlX_srNmtr_W3"k
    console.log(rid);
    convert(`https://www.googleapis.com/drive/v3/files/${rid}?alt=media`, `./${id}.mp3`,rid, async function(err){
        if(!err) {
            console.log('conversion complete');
            let data = new FormData();
            data.append('audio_data', fs.createReadStream(`./${id}.mp3`));
            data.append('num_speaker', numberOfSpeakers);
            
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
            fs.unlinkSync(`./${id}.mp3`);
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
                meeting: {
                    connect: {
                    id: id
                    }
                }
                }
            });
            console.log(transcript);
            });
        });
        console.log("done");
        }
        else{
            console.log(err);
        }
        });
    })
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