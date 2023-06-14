const express = require("express");
const app = express();
const cors = require("cors");
const KJUR = require("jsrsasign");
const { Zoom_cred_sdk } = require("./Zoom_cred_sdk");
const { Zoom_cred_server } = require("./Zoom_cred_server");
const querystring = require("querystring");
const bodyParser = require('body-parser');
const port = 5000;
const mongoDB = require("./db");
const fetch = require("node-fetch");
const User = require("./models/User");
mongoDB();

app.use(cors("https://salestine-jevil25.vercel.app/"));
app.use(express.json());
// console.log(Zoom_cred_server.SDK.KEY)

app.use("/api", require("./Routes/register"));
app.use("/api", require("./Routes/login"));
// Enable JSON body parsing middleware
app.use(bodyParser.json());

//enpoint for generating signature
app.post("/api/generate", (req, res) => {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };
  console.log(req.body);

  const oPayload = {
    sdkKey: Zoom_cred_sdk.SDK.KEY,
    appKey: Zoom_cred_sdk.SDK.KEY,
    mn: req.body.meetingNumber,
    role: req.body.role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.jws.JWS.sign(
    "HS256",
    sHeader,
    sPayload,
    Zoom_cred_sdk.SDK.SECRET
  );
  console.log("Signature is" + sdkJWT);
  res.json({ sdkJWT });
});

//generate authorization code
app.get("/api/authorize", (req, res) => {
  // Redirect the user to the Zoom authorization URL
  const queryParams = querystring.stringify({
    response_type: "code",
    client_id: Zoom_cred_server.SDK.KEY,
    redirect_uri: "https://salestine-jevil25.vercel.app/Zoommeetstart",
  });
  const authorizationUrl = `https://zoom.us/oauth/authorize?${queryParams}`;
  console.log(authorizationUrl);
  // res.redirect(authorizationUrl);
  res.json({ authorizationUrl });
});

//get access token in exchange for auth code
app.post("/api/callback", async (req, res) =>{

  // const { code } = req.body.code;
  console.log(req)
  const code = req.body.code;
  console.log("code is" + code);
  //creating authorization header
  const clientId = Zoom_cred_server.SDK.KEY;
  const clientSecret = Zoom_cred_server.SDK.SECRET;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  const authorizationHeader = "Basic "+encodedCredentials;

  console.log(authorizationHeader);

  try {
    // Exchange the authorization code for an access token
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Host": "zoom.us",
        "Authorization" : authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: querystring.stringify({
        grant_type: "authorization_code",
        client_id: Zoom_cred_server.SDK.KEY,
        client_secret: Zoom_cred_server.SDK.SECRET,
        code,
        redirect_uri: "https://salestine-jevil25.vercel.app/Zoommeetstart"
      }),
    })

    if (response.ok) {
      const { access_token } = await response.json();

      // Send back the authorization code and access token as the response
      res.json({ code, access_token });
      // res.json({response})
    } else {
      console.error("Failed to exchange authorization code for access token");
      res
        .status(510)
        .json({
          error: "Failed to exchange authorization code for access token",
        });
    }
  } catch (error) {
    console.error(
      "Failed to exchange authorization code for access token:",
      error
    );
    // res
    //   .status(500)
    //   .json({
    //     error: "Failed to exchange authorization code for access token",
    //   });
  }
});

//endpoint for starting a meet
app.post("/api/start-meet", async (req, res) => {
  console.log("this is acestok");
  console.log("Bearer "+req.body.accessToken)
  try {
    // Make a POST request to the Zoom API's "start meeting" endpoint
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Authorization":`Bearer ${req.body.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        
          "topic": "test",
          "type":2,
          "start_time": "2023-06-9T18:40:10Z",
          "duration":"3",
          "settings":{
           "host_video  ":true,
           "participant_video":true,
           "join_before_host":true,
           "mute_upon_entry":"true",
           "watermark": "true",
           "audio": "voip",
           "auto_recording": "local"
             }
      }),
    });

    // Check if the request was successful
    if (response.ok) {
      // Extract the meeting URL from the response
      const result = await response.json();
      // console.log(result);
      await User.updateOne(
        { userId: result.host_id },
        { $push: { meetings: { meetingId: result.id }} }
      );
      // const user = await User.findOne({ userId: result.host_id });
      // console.log(user);
      // await user.save();
      // user = await User.findOne({ accessToken: req.body.accessToken });
      // console.log(user);
      // Send the meeting URL as the API response
      res.json({ result: result });
    } else {
      // Handle Zoom API error response
      const errorData = await response.json();
      console.error("Error starting meeting:", errorData);
      res.status(response.status).json({ error: "Failed to start meeting" });
    }
  } catch (error) {
    // Handle any errors that occurred during the API call
    console.error("Error starting meeting:", error);
    res.status(500).json({ error: "Failed to start meeting" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


app.post("/api/getRecordings", async (req, res) => {
  try {
    console.log(req.body.access_token);
    // Make a GET request to the Zoom API's "list recordings" endpoint
    const response = await fetch(
      `https://api.zoom.us/v2/users/me/recordings?page_size=30`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${req.body.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Check if the request was successful
    if (response.ok) {
      // Extract the meeting URL from the response
      const { recordings } = await response.json();

      // Send the meeting URL as the API response
      res.json({ recordings });
    } else {
      // Handle Zoom API error response
      const errorData = await response.json();
      console.error("Error starting meeting:", errorData);
      res.status(response.status).json({ error: "Failed to start meeting" });
    }
  } catch (error) {
    // Handle any errors that occurred during the API call
    console.error("Error starting meeting:", error);
    res.status(500).json({ error: "Failed to start meeting" });
  }
}
);

//create zoom api to join meet
app.post("/api/join-meet", async (req, res) => {
  try {
    // Make a POST request to the Zoom API's "start meeting" endpoint
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Authorization":`Bearer ${req.body.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        
          "topic": "test",
          "type":2,
          "start_time": "2023-06-9T18:40:10Z",
          "duration":"3",
          "settings":{
           "host_video  ":true,
           "participant_video":true,
           "join_before_host":true,
           "mute_upon_entry":"true",
           "watermark": "true",
           "audio": "voip",
           "auto_recording": "cloud"
             }
      }),
    });

    // Check if the request was successful
    if (response.ok) {
      // Extract the meeting URL from the response
      const result = await response.json();

      // Send the meeting URL as the API response
      res.json({ result: result });
    } else {
      // Handle Zoom API error response
      const errorData = await response.json();
      console.error("Error starting meeting:", errorData);
      res.status(response.status).json({ error: "Failed to start meeting" });
    }
  } catch (error) {
    // Handle any errors that occurred during the API call
    console.error("Error starting meeting:", error);
    res.status(500).json({ error: "Failed to start meeting" });
  }
}
);

app.post("/api/zoomLogin", (req, res) => {
  const params = "response_type=code&client_id="+Zoom_cred_server.SDK.KEY+"&redirect_uri=https://salestine-jevil25.vercel.app/login";
  // console.log(params);
  res.json(
    `https://zoom.us/oauth/authorize?${params}` 
    );
}
);

app.post("/api/accessToken", async (req, res) =>{

  const code = req.body.code;
  // console.log("code is" + code);
  //creating authorization header
  const clientId = Zoom_cred_server.SDK.KEY;
  const clientSecret = Zoom_cred_server.SDK.SECRET;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  const authorizationHeader = "Basic "+encodedCredentials;

  // console.log(authorizationHeader);

  try {
    // Exchange the authorization code for an access token
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Host": "zoom.us",
        "Authorization" : authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: querystring.stringify({
        code: code,
        grant_type: "authorization_code",
        redirect_uri: "https://salestine-jevil25.vercel.app/login",
      }),
    })

    if (response.ok) {
      const { access_token,refresh_token,expires_in } = await response.json();
      // Calculate expiration time
      const now = new Date();
      const expiryTime = new Date(now.getTime() + expires_in * 1000);

      const result = await fetch("https://api.zoom.us/v2/users/me", {
      method: "GET",
      headers: {
        "Authorization":`Bearer ${access_token}`,
        "Content-Type": "application/json",
        },
      });
      if (result.ok) {
        const data = await result.json();
        const user = await User.findOne({email: data.email})
        if(user === null){
          const newUser = {
            userId: data.id,
            zoomEmail: data.email,
            name: data.display_name,
            provider: "Zoom",
            meetings: [],
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiry: expiryTime,
            verified: true,
            role: "user",
            createdAt: new Date(),
            organization: [],
            sales: {
              total: 0,
              active: 0,
              closed: 0,
            }
          };
          User.create(newUser).then(()=> console.log("Created Successfully"))
        }else{
          User.findOneAndUpdate(
            { email: data.email },
            {
              accessToken: access_token,
              refreshToken: refresh_token,
              tokenExpiry: expiryTime,
            },
            { new: true }
          )
            .then(updatedUser => {
              // console.log("Updated user:", updatedUser);
            })
            .catch(err => {
              console.error("Error updating user:", err);
            });
        }
      }
      else{
        const errorData = await response.json();
        console.error("Error starting meeting:", errorData);
        res.status(response.status).json({ error: "Failed to start meeting" });
      }

      res.json({ access_token,refresh_token,expiryTime });

    } else {
      console.error("Failed to exchange authorization code for access token");
      res
        .status(510)
        .json({
          error: "Failed to exchange authorization code for access token",
        });
    }
  } catch (error) {
    console.error(
      "Failed to exchange authorization code for access token:",
      error
    );
  }
});

app.post("/api/newAccessToken", async (req, res) =>{
    // const { code } = req.body.code;
  console.log(req)
  const code = req.body.refreshToken;
  console.log("code is" + code);
  //creating authorization header
  const clientId = Zoom_cred_server.SDK.KEY;
  const clientSecret = Zoom_cred_server.SDK.SECRET;

  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");
  const authorizationHeader = "Basic "+encodedCredentials;

  console.log(authorizationHeader);

  try{
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Host": "zoom.us",
        "Authorization" : authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: req.body.refresh_token,
      }),
    })
    if (response.ok) {
      const { access_token,refresh_token,expires_in } = await response.json();
      res.json({ access_token,refresh_token,expires_in });

    } else {
      console.error("Failed to exchange authorization code for access token");
      res
        .status(510)
        .json({
          error: "Failed to exchange authorization code for access token",
        });
    }
  }catch(error){
    console.error(
      "Failed to exchange authorization code for access token:",
      error
    );
  }
});

app.post("api/user", async (req, res) => {
  try{
    const response = await fetch("https://api.zoom.us/v2/users/me", {
      method: "GET",
      headers: {
        "Authorization":`Bearer ${req.body.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const result = await response.json();
      //TO DO:adding user data to database
      res.json({ result: result });
    }
    else{
      const errorData = await response.json();
      console.error("Error starting meeting:", errorData);
      res.status(response.status).json({ error: "Failed to start meeting" });
    }
  }catch(error){
    console.error(
      "Failed to exchange authorization code for access token:",
      error
    );
  }
});

app.post("/api/salestineLogin", async (req, res) => {
  try{
    const user = await User.findOne({email: req.body.email})
    const Zoomuser = await User.findOne({zoomEmail: req.body.email})
    console.log(user)
    if(!user){
      if(!Zoomuser){
        console.log("User found")
        res.status(404).json({ error: "User not found", success: false });
      }
    }
    else{
      if(user.provider === "Zoom" || Zoomuser.provider === "Zoom"){
        res.status(400).json({ error: "Zoom Account", success: true });
      }
      else{
        if(user.password === req.body.password){
          res.json({
                    access_token: user.accessToken,
                    refresh_token: user.refreshToken,
                    expiryTime: user.tokenExpiry,
                    success: true,
                  });
        }
        else{
          res.status(400).json({ error: "Incorrect password", success: false });
        }
      }
    }
  }
  catch(error){
    console.error(
      "Failed to exchange authorization code for access token:",
      error
    );
  }
});

app.post("/api/storeMeetId", async (req, res) => {
  try{
    const meetingId = req.body.meetingNumber;
    const email = req.body.email;
    console.log(meetingId)
    await User.updateOne(
      { email: email },
      { $push: { meetings: { meetingId: result.id }} }
    );
  }catch(error){
    console.error(
      "Failed to store",
      error
    );
  }
});

app.get("/",(req,res) => {
  res.send("Hello World");
})