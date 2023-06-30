const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const prisma = require("../utils/db/prisma");
const ffmpeg = require('fluent-ffmpeg');

function convert(input, output, callback) {
  axios({
    method: 'GET',
    url: input,
    responseType: 'stream',
  })
    .then((response) => {
      // Pipe the downloaded video to FFmpeg for conversion
      ffmpeg(response.data)
        .format('wav')
        .on('end', () => {
          console.log('Conversion completed.');
          // Remove the downloaded video file
          fs.unlinkSync('video.mp4');
        })
        .on('error', (err) => {
          console.error('Error during conversion:', err);
        })
        .save(output);
    })
    .catch((err) => {
      console.error('Error during download:', err);
    });
}

async function handler(req, res) {
  const meets = await prisma.meeting.findMany({
    where: {
      transcriptionCompleted: false,
      transcriptionRequested: false,
      recordingLink: {
        not: ""
      } 
    }
  });
  console.log(meets);
  meets.map(async (meet) => {
    const { id, recordingLink,numberOfSpeakers } = meet;
    //get id from recordingLink
    const rid = recordingLink.split('d/')[1].split('/')[0];
    console.log(rid);
    convert(recordingLink, `./${id}.wav`, async function(err){
      if(!err) {
          console.log('conversion complete');
          let data = new FormData();
          data.append('audio_data', fs.createReadStream(`./${id}.wav`));
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
        
          const response =  await fetch(config.url, {
              method: config.method,
              headers:{
                ...data.getHeaders()
              },
              body: data
          });
          const json = await response.json();
          // const json = {
          //   status: true,
          //   descript: '',
          //   data: [
          //     "[{\"speaker\": \"speaker_0\", \"start_time\": \"0.28\", \"end_time\": 7.12, \"text\": \"hello hello my name is adam hello hello hello\"}, {\"speaker\": \"speaker_1\", \"start_time\": 7.88, \"end_time\": 9.04, \"text\": \"hello hello hello\"}]"
          //   ]
          // }
          console.log(json);
          json.data.map((item) => {
            item = JSON.parse(item);
            item.map((item) => {
            let speaker = item.speaker;
            let start_time = item.start_time;
            let end_time = item.end_time;
            let text = item.text;
            console.log(speaker, start_time, end_time, text);
            })
          });
          res.send(json)
        }
      });
    }
  )
}

module.exports = handler;