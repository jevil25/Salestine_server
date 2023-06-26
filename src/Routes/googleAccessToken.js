const { google } = require("googleapis");
const prisma = require("../utils/db/prisma");


async function handler(req, res) {
    console.log(req.body);
    const { refresh_token,email } = req.body;
    if(!refresh_token || !email){
        return res.status(400).json({message: "Missing refresh_token or email"});
    }
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token });
    console.log(oAuth2Client);
    oAuth2Client.on('tokens', async (tokens) => {
        console.log(tokens);
        if (tokens.refresh_token) {
          console.log(tokens.refresh_token);
        }
        console.log(tokens.access_token);
        const user = await prisma.user.update({
            where: { email },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
            },
        });
        return res.send(user)
      });
      return res.send({message: "Token not refreshed"})
}

module.exports = handler;