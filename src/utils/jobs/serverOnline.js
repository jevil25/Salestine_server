const https = require('https');
var cron = require('node-cron');

handler = async () => {
 const url = process.env.SERVER_URL;
 console.log(url);

 return new Promise((resolve, reject) => {
   const req = https.get(url, (res) => {
     if (res.statusCode === 200) {
       resolve({
         statusCode: 200,
         body: 'Server pinged successfully',
       });
       console.log('Server pinged successfully');
     } else {
       reject(
         new Error(`Server ping failed with status code: ${res.statusCode}`)
       );
     }
   });

   req.on('error', (error) => {
     reject(error);
   });

   req.end();
 });
};

function ping()
{
    handler();
    //run every 10 minutes
    cron.schedule('*/10 * * * *', () => {
        handler();
    });
}

module.exports = ping;