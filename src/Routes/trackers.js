const express = require('express');
const router = express.Router();
const prisma = require('../utils/db/prisma');
const { default: fetch } = require('node-fetch');

router.post('/', async (req, res) => {
    const { meetingId } = req.body;
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

    const text = await prisma.transcript.findMany({
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
    for(let i = 0; i < text.length; i++){
        onlyText += text[i].text + "\n";
    }
    //get tracker name from company id
    const tracker = await prisma.tracker.findUnique({
        where:{
            companyId: text[0].meeting.companyid,
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
        //get labels
        if(response.error){
            return;
        }
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
        res.send(file);
    });
});

module.exports = router;