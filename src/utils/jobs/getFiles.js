const prisma = require("../db/prisma");
const fetch = require('node-fetch');
const cron = require('node-cron');
const handler = require('../google/getAccessToken');

const getFiles = async () => {
    try{
        // console.log("getting files");
        let meets = await prisma.meeting.findMany({
            where: {
              file: {
                none: {}
              }
            }
          });
          //filter meets without recordingLink
          meets = meets.filter(meet => meet.recordingLink !== "");
          // console.log(meets);
          meets.map(async (meet) => {
            const update = async () => {
            const { id, recordingLink,numberOfSpeakers,meetid } = meet;
            const accessToken = await handler(process.env.DRIVE_EMAIL);
            // console.log(accessToken);
            const folderId = recordingLink.split('folders/')[1].split('/')[0]; // Extract the folder ID from recordingLink
            // console.log(folderId);
            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents`; // Construct the URL to fetch the files inside the folder
            fetch(url, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                }
                })
            .then(response => response.json())
            .then(async data => {
              console.log(data);
              if(data.files){
              const audioFile = data.files.filter(file => file.name.startsWith('audio'))[0].id;
              const videoFile = data.files.filter(file => file.name.startsWith('video'))[0].id;
              console.log("video",videoFile);
              //store in db
              console.log(id);
              if(videoFile !== undefined || videoFile !== null || videoFile !== "" ){
                console.log("updating meeting");
                const updatedFile = await prisma.file.create({
                  data: {
                    meetingId: meetid,
                    audioId: audioFile,
                    videoId: videoFile,
                    transcriptionComplete: false,
                  }
                });
                console.log(updatedFile);
              }
            }
            })
        }
        update();
    })
    }catch(err){
        console.log(err);
    }
}

const file = () => {
    getFiles();

    //run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        getFiles();
    });
}

module.exports = file;