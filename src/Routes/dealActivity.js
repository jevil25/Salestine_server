const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  if (req.method != "POST") {
    res.status(400).json({ error: "Method not allowed" });
  }
  const { userId, dealId } = req.body;
  if (!userId || !dealId) {
    res.status(400).json({ error: "Missing Credentials" });
  }
  try {
    const userdeals = await prisma.deals.findMany({
      where: { userId: userId },
    });
    const userdealarr = userdeals[0].data.data;
    const deal = await userdealarr.find((deal) => dealId == deal.id);
    console.log(deal);
    res.status(200).json({ message: "Success", deal: deal });
  } catch (err) {
    res.status(500).json({ Error: err });
  }
}

module.exports = handler;
