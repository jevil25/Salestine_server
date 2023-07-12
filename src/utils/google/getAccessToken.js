const { google } = require("googleapis");
const prisma = require("../db/prisma");
const { default: fetch } = require("node-fetch");

async function handler(email) {
  // console.log(email);

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

  return fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
        }),
      })
      .then((res) => res.json())
      .then(async (json) => {
        console.log(json);
        const { access_token, expires_in } = json;
        await prisma.user.update({
          where: { email },
          data: {
            googleAccessToken: access_token,
            googleTokenExpiry: expires_in,
          },
        });
        console.log("Updated access token");
        // console.log(access_token);
        return access_token;
      }
    )
    .catch((err) => {
      console.log(err);
    }
  );
}

module.exports = handler;
