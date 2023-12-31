const prisma = require("../utils/db/prisma");

async function handler(req,res){

    try {
        // Retrieve all objects from the "recordings" collection
        const { email } = req.body;
        if(!email){
            return res.status(404).json({ message: "Email not found.",status: false });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if(user.role === "SUPERADMIN"){
            const allRecordings = await prisma.meeting.findMany(
              {
                include: {
                  file: true,
                }
              }
            );
            return res.status(200).json({ recordings: allRecordings });
        }
        if(user.role === "ADMIN"){
          const allRecordings = await prisma.meeting.findMany({
            where: {
              companyid: user.companyId,
            },
            include: {
              file: true,
            }
          });
          return res.status(200).json({ recordings: allRecordings });
        }
        const allRecordings = await prisma.meeting.findMany({
            where: { 
              meetHostId: user.id,
            },
            include: {
              file: true,
            }
        });
    
        // Do something with the "allRecordings" variable
        console.log(allRecordings);
    
        // Return a response
        res.status(200).json({ recordings: allRecordings });
      } catch (error) {
        // Handle any errors that occurred during the operation
        console.error('Error retrieving recordings:', error);
        res.status(500).json({ error: 'Failed to retrieve recordings' });
      }
    
}

module.exports = handler;