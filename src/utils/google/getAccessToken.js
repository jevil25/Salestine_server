const { google } = require("googleapis");
const prisma = require("../db/prisma");

async function handler() {
  const email = process.env.DRIVE_EMAIL;
  console.log(email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  const refresh_token = user.googleRefreshToken;

  if (!refresh_token || !email) {
    console.log("Missing refresh_token or email");
    return;
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({ refresh_token });

  try {
    const { res,token } = await oAuth2Client.getAccessToken();
    console.log(res.data);
    if (res.data) {
      console.log(res.data);

      await prisma.user.update({
        where: { email },
        data: {
          googleAccessToken: res.data.access_token,
          googleRefreshToken: res.data.refresh_token,
        },
      });

      console.log("Token refreshed");
    }
  } catch (error) {
    console.error("Failed to refresh access token:", error);
  }
}

module.exports = handler;
