const prisma = require("../utils/db/prisma");

const getTeamDetails = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            }
        });
        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const users = await prisma.user.findMany({
            where: {
                companyId: user.companyId,
            }
        });
        const team = users.map((user) => {
            const { id, name, email, role } = user;
            return { id, name, email, role };
        });
        //get all calls of this company 
        const calls = await prisma.meeting.findMany({
            where: {
                companyid: user.companyId,
            },
            include: {
                analysis: true,
                Company: true,
                file: true,
            }
        });
        return res.status(200).json({ team: team, calls: calls, status: true });
    } catch (error) {
        return res.status(500).json({ error: error.message, status: false });
    }
};

module.exports = getTeamDetails;