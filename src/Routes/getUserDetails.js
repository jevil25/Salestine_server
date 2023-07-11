const prisma = require("../utils/db/prisma");

async function handler(req, res) {
    const email = req.body.email;
    if (!email) {
        return res.status(404).json({ message: "Email not found.", status: false });
    }
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email
            },
            include: {
                meeting: true,
                company: true,
            }
        });
        return res.status(200).json({ message: "User details fetched successfully.", status: true, user: user });
    } catch (error) {
        // Handle any errors that occurred during the operation
        console.error("Error retrieving recordings:", error);
        res.status(500).json({ error: "Failed to retrieve recordings" });
    }
}

module.exports = handler;