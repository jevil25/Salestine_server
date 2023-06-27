const prisma = require("../utils/db/prisma");

async function handler(req,res){

    try {
        // Retrieve all objects from the "recordings" collection
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
        });
        const allRecordings = await prisma.meeting.findMany({
            where: { 
              meetHostId: user.id
            }
        });
    
        // Do something with the "allRecordings" variable
        console.log("yooo")
        console.log(allRecordings);
    
        // Return a response
        res.status(200).json({ recordings: allRecordings });
      } catch (error) {
        // Handle any errors that occurred during the operation
        console.error('Error retrieving recordings:', error);
        res.status(500).json({ error: 'Failed to retrieve recordings' });
      }
    
}
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Retrieve all objects from the "recordings" collection
        const allRecordings = await prisma.meeting.findMany({});
    
        // Do something with the "allRecordings" variable
        console.log("yooo")
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