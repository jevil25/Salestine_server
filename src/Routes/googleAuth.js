const { google } = require("googleapis");
const prisma = require("../utils/db/prisma");

async function handler(req, res) {
  if (req.method === "GET") {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });
    res.send({ url:authUrl });
  } else if (req.method === "POST") {
    const { code,email } = req.body;

    // Exchange the authorization code for a token
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.getToken(code, async(err,authToken) => {
      if(err){
        console.log(err);
        res.send({message: err})
      }
      console.log(authToken);
      const user = await prisma.user.update({
        where: { email },
        data: { 
            googleAccessToken: authToken.access_token,
            googleRefreshToken: authToken.refresh_token,
            googleTokenExpiry: authToken.expiry_date,
         },
        });
      res.send(authToken)
    })
  }
}

module.exports = handler;