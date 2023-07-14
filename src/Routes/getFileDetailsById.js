const prisma = require('../utils/db/prisma');

async function handler(req, res) {
  if(req.method !== 'POST') {
    res.status(400).json({ message: 'Only POST requests are allowed' });
    return;
  }
  try{
    const { fileId } = req.body;
    if(!fileId) {
      res.status(400).json({ message: 'File id is required' });
      return;
    }
    const file = await prisma.file.findUnique({
      where: {
        id: fileId
      },
        include: {
            meeting: true,
        }
    });
    if(!file) {
        res.status(404).json({ message: 'File not found' });
        return;
    }
    res.status(200).json({ file,status: true });
  }catch(err){
    console.log(err);
    res.status(500).json({ message: 'Something went wrong',error: err });
  }
}


module.exports = handler;