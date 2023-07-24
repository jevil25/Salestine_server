const prisma = require('../db/prisma');
const { default: fetch } = require('node-fetch');
const cron = require('node-cron');

async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/kabita-choudhary/finetuned-bart-for-conversation-summary",
        {
            headers: { Authorization: `Bearer ${process.env.summarization_token}` },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
  }

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

const summarization = async () => {
    const files = await prisma.file.findMany({
        where:{
            analysisComplete: true,
            transcriptionComplete: true,
            summaryComplete: false
        },
    });
    console.log("summary file",files);
    let msg = "";
    for(let i = 0; i < files.length; i++){
        const text = await prisma.transcript.findMany({
            where: {
                meetingId: files[i].meetingId
            },
            select: {
                speaker: true,
                text: true
              }
          });
            //make msg into a string
            for(let i = 0; i < text.length; i++){
                msg += "speaker" + text[i].speaker + ": " + text[i].text + "\n";
            }
            if(msg === ""){
                const file = await prisma.file.update({
                    where: {
                        meetingId: files[i].meetingId
                    },
                    data: {
                        summaryComplete: true,
                        summary: "",
                        trackerComplete: true,
                        trackerData: {}
                    }
                });
                return;
            }
            //send to summarization
            query({"inputs": msg}).then(async (response) => {
                if(response !== undefined){
                    const summary = response[0].summary_text;
                    const file = await prisma.file.update({
                        where: {
                            meetingId: files[i].meetingId
                        },
                        data: {
                            summary: summary,
                            summaryComplete: true
                        }
                    });
                    console.log(file);
                }
            }
        );
    }
    const files1 = await prisma.file.findMany({
        where:{
            analysisComplete: true,
            transcriptionComplete: true,
            trackerComplete: false
        },
    });
    console.log(files1);
    for(let i = 0; i < files1.length; i++){
        const text1 = await prisma.transcript.findMany({
            where: {
                meetingId: files1[i].meetingId,
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
        console.log(onlyText);
        if(onlyText === ""){
            const file = await prisma.file.update({
                where: {
                    meetingId: files1[i].meetingId
                },
                data: {
                    trackerComplete: true,
                    summaryComplete: true,
                    trackerData: {}
                }
            });
            return;
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
                    meetingId: files1[i].meetingId
                },
                data: {
                    trackerData: responseJson,
                    trackerComplete: true
                }
            });
        });
    }   
}

const summary = () => {
    //run every 10 minutes
    console.log('Running summary job...');
    summarization();
    cron.schedule('*/10 * * * *', summarization)
} 

module.exports = summary;