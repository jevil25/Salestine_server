const prisma = require("../utils/db/prisma");

const getIndividualDetails = async (req, res) => {
    const { email } = req.body;
    console.log(email);
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            }
        });
        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }
        //get all calls of this company 
        const calls = await prisma.meeting.findMany({
            where: {
                meetHostId: user.id,
            },
            include: {
                analysis: true,
                Company: true,
                file: true,
            }
        });
        return res.status(200).json({ user:user,calls: calls, status: true });
    } catch (error) {
        return res.status(500).json({ error: error.message, status: false });
    }
};

module.exports = getIndividualDetails;