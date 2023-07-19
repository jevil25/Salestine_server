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

const summarization = async () => {
    const files = await prisma.file.findMany({
        where:{
            analysisComplete: true,
            transcriptionComplete: true,
            summaryComplete: false
        }
    })
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
            //send to summarization
            query({"inputs": msg}).then(async (response) => {
                if(response[0].summary_text){
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
}

const summary = () => {
    //run every 10 minutes
    console.log('Running summary job...');
    summarization();
    cron.schedule('*/10 * * * *', summarization)
} 

module.exports = summary;