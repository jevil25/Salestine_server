const { APIDECK_API_KEY } = process.env;
const { APIDECK_APP_ID } = process.env;

async function handler(req, res) {
  if (req.body.flag == "crmauth") {
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
  else{
    res.status(400).json({error:"Invalid flag"})
  }
}

module.exports = handler;
