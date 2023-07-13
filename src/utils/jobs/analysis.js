const { json } = require('express');
const prisma = require('../db/prisma');
const cron = require('node-cron');
const fetch = require('node-fetch');
const FormData = require('form-data');

const analysis = async () => {
    try{
        console.log("inside analysis")
        const analysis = await prisma.file.findMany({
            where: {
                transcriptionComplete: true,
                analysisComplete: false,
            },
        });
        analysis.forEach(async (items) => {
            const data = new FormData();
            console.log("analysis request sent")
            data.append('diar_data', items.diarizerText);
            const analy = await fetch(process.env.ANALYZE_URL, {
                method: 'post',
                body: data,
            }).then((res) => res.json()).then(async (data) => {
                console.log(data);
                if(data.status === false){
                const analy = await prisma.analysis.create({
                    data: {
                    meetingId: items.meetingId,
                    },
                });
                return false;
                }
                const analysis1 = data.data;
                analysis1.forEach(async (item) => {
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
                                meetingId: items.meetingId,
                                speaker: speaker,
                            }
                        },
                        create: {
                            meetingId: items.meetingId,
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
                        meetingId: items.meetingId,
                    },
                    data: {
                        analysisComplete: true,
                    }
                });
        });
        });
    }catch(err){
        console.log(err);
    }
}

const analysisTimer = () => {
    analysis()
    //run every 60mins
    cron.schedule('0 */60 * * * *', () => {
        analysis();
    });
}

module.exports = analysisTimer;