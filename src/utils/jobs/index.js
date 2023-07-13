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

const convert = async (input, output, rid, accessToken) => {
  try {
    console.log("Fetching video from drive");
    const response = await axios({
      method: 'GET',
      url: input,
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    console.log(response.status);
    console.log(response.statusText);
    const fileData = Buffer.from(response.data);
    fs.writeFileSync(`${rid}.m4a`, fileData);
    console.log("Converting to audio");

    return new Promise((resolve, reject) => {
      ffmpeg(`${rid}.m4a`)
        .output(output)
        .audioCodec('libmp3lame')
        .on('end', () => {
          console.log('Conversion complete!');
          try {
            fs.unlinkSync(`${rid}.m4a`);
            resolve();
          } catch (err) {
            console.log(err);
            reject(err);
          }
        })
        .on('error', (err) => {
          console.error('An error occurred:', err.message);
          reject(err);
        })
        .run();
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const processFile = async (file) => {
  const { id, audioId, meetingId } = file;
  const rid = audioId;
  const accessToken = await handler(process.env.DRIVE_EMAIL);

  try {
    await convert(
      `https://www.googleapis.com/drive/v3/files/${rid}?alt=media`,
      `./${id}.wav`,
      rid,
      accessToken
    );

    const data = new FormData();
    data.append('audio_data', fs.createReadStream(`./${id}.wav`));
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
      fs.unlinkSync(`./${id}.wav`);
      throw new Error('Failed to upload the converted file.');
    }

    console.log("Waiting for response from ASR");
    const json = await response.json();

    //delete wav file
    fs.unlinkSync(`./${id}.wav`);
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
        const analy = await prisma.analysis.create({
          data: {
            meetingId: meetingId,
          },
        });
        return false;
      }
      const analysis = data.data;
      analysis.forEach(async (item) => {
        const speaker = Object.keys(item)[0];
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
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const runTask = async () => {
  console.log('Running cron job...');

  try {
    // Get files where transcriptionComplete is false
    const files = await prisma.file.findMany({
      where: {
        transcriptionComplete: false,
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

const job = () => {
  // Run the task immediately
  runTask();

  // Schedule the task to run every 120 minutes
  cron.schedule('*/180 * * * *', runTask);
};

module.exports = job;
