const { APIDECK_API_KEY } = process.env;
const { APIDECK_APP_ID } = process.env;
const fetch = require("node-fetch");
const prisma = require("../utils/db/prisma");
const dayjs = require("dayjs");

async function handler(req, res) {
  try {
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

    //list opportunities
    else if (flag == "listopp") {
      if (req.method != "POST") {
        res.status(400).json({ message: "Invalid method,only post allowed" });
      }
      const { email } = req.body;
      const today = dayjs().startOf("day").format("YYYY-MM-DD");
      console.log(today);
      const user = await prisma.user.findUnique({
        where: { email },
      });
      // console.log(user)
      if (user.crmapi_ctr != today) {
        const data = await fetch(
          "https://unify.apideck.com/crm/opportunities?raw=true",
          {
            headers: {
              Authorization: "Bearer " + APIDECK_API_KEY,
              "x-apideck-app-id": APIDECK_APP_ID,
              "x-apideck-consumer-id": email,
            },
          }
        ).then((res) => res.json());
        if (data.error && data.error == "Unauthorized") {
          res
            .status(400)
            .json({ success: false, message: "Integrate your CRM" });
        }
        if (user.crmapi_ctr == "") {
          const user = await prisma.user.update({
            where: { email },
            data: { crmapi_ctr: today },
          });
          const deal = await prisma.deals.create({
            data: {
              userId: user.id,
              data: data,
            },
          });
          res.status(200).json({message: "success", data: data, user, deal });
        } else {
          // const owner_name = await fetch(`https://unify.apideck.com/crm/users/${owner_id}`)
          const user = await prisma.user.update({
            where: { email },
            data: { crmapi_ctr: today },
          });
          const deal = await prisma.deals.updateMany({
            where: { userId: user.id },
            data: { data: data },
          });
          res.status(200).json({ message: "success", data: data, user, deal });
        }
      } else {
        // console.log("opportunities have already been fetched today");
        const data = await prisma.deals.findMany({
          where: { userId: user.id },
        });
        // console.log(user.id);
        res.status(200).json({
          message: "API already fetched today",
          data: data,
          userId: user.id,
        });
      }
    } else {
      res.status(400).json({ error: "Invalid flag" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = handler;
