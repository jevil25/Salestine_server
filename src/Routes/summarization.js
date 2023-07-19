const express = require('express');
const { default: fetch } = require('node-fetch');
const router = express.Router();
const prisma = require('../utils/db/prisma');

router.post('/', async(req, res) => {
    try{
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ message: "Please provide data" });
        }

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

        const text = await prisma.transcript.findMany({
            where: {
                meetingId: data
            },
            select: {
                speaker: true,
                text: true
            }
        });

        //make msg into a string
        let msg = "";
        for(let i = 0; i < text.length; i++){
            msg += "speaker" + text[i].speaker + ": " + text[i].text + "\n";
        }
        query({"inputs": msg}).then(async (response) => {
            if(response[0].summary_text){
                const summary = response[0].summary_text;
                const file = await prisma.file.update({
                    where: {
                        meetingId: data
                    },
                    data: {
                        summary: summary
                    }
                });
            }
            res.status(200).json(response);
        });
    }catch(err){
        console.log(err);
    }
});

module.exports = router;