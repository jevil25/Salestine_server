const { APIDECK_API_KEY } = process.env;
const { APIDECK_APP_ID } = process.env;
const fetch = require("node-fetch");
const prisma = require("../utils/db/prisma");
const dayjs = require("dayjs");

async function handler(req, res) {
  if (req.method != "POST") {
    res.status(400).json({ message: "Invalid method,only post allowed" });
  }

  let { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    res.status(400).json({ status: 400, error: "user doesnt exist" });
  }
//   console.log(user)
  let userId = user.id;
  console.log(userId)
  let deal_users = await prisma.deals.findMany({
    where: { userId:userId },
  });
  if (deal_users) {
    res.status(200).json({ status: 200, deals: deal_users });
  } else {
    res.status(400).json({ status: 400 });
  }
}

module.exports = handler;
