const { APIDECK_API_KEY } = process.env;
const { APIDECK_APP_ID } = process.env;
const fetch = require("node-fetch");
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  try{
    const { flag } = req.body;
    if (flag == "crmauth") {
      if (req.method != "POST") {
        res.status(400).json({ message: "Invalid method,only POST allowed" });
      }
      const { email } = req.body;
      let resp = await fetch("https://unify.apideck.com/vault/sessions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + APIDECK_API_KEY,
          "x-apideck-app-id": APIDECK_APP_ID,
          "x-apideck-consumer-id": email,
        },
      }).then((res) => res.json());
      res.status(200).json({ data: resp });
    } 
    else if (flag == "listopp") {
      if (req.method != "POST") {
        res.status(400).json({ message: "Invalid method,only post allowed" });
      }
      const { email } = req.body;
      const data = await fetch("https://unify.apideck.com/crm/opportunities?raw=true", {
        headers: {
          Authorization: "Bearer " + APIDECK_API_KEY,
          "x-apideck-app-id": APIDECK_APP_ID,
          "x-apideck-consumer-id": email,
        },
      }).then((res)=>res.json());
      if(data.error && data.error == "Unauthorized"){
        res.status(400).json({success:false,message:"Integrate your CRM"})
      }
      else{
        const user = await prisma.user.findUnique({
          where: { email },
        });
        res.status(200).json({message:"success",data:data,user})
      }
      
    } else {
      res.status(400).json({ error: "Invalid flag" });
    }
  }catch(err){
    console.log(err)
    res.status(500).json({message:"Internal Server Error"})
  }
}

module.exports = handler;
