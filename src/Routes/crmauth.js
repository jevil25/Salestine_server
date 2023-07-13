const { APIDECK_API_KEY } = process.env;
const { APIDECK_APP_ID } = process.env;

async function handler(req, res) {
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
  } else if (flag == "listopp") {
    if (req.method != "GET") {
      res.status(400).json({ message: "Invalid method,only GET allowed" });
    }
    const data = await fetch("https://unify.apideck.com/crm/opportunities", {
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
      res.status(200).json({success:true,data:data})
    }
    
  } else {
    res.status(400).json({ error: "Invalid flag" });
  }
}

module.exports = handler;
