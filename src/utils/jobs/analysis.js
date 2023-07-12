const prisma = require('../db/prisma');
const cron = require('node-cron');

const analysis = async () => {
    try{
        const analysis = await prisma.file.findMany({
            where: {
                transcriptionComplete: true,
                analysisComplete: false,
            },
        });
        analysis.forEach(async (items) => {
            const analy = await fetch(process.env.ANALYZE_URL, {
                method: 'post',
                body: {
                diar_data: items.diarizerText,
                }
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
                const analysis = data.data;
                data.forEach(async (item) => {
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
                        meetingId: meetingId,
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
    //run every 60mins
    cron.schedule('0 */60 * * * *', () => {
        analysis();
    });
}

module.exports = analysisTimer;