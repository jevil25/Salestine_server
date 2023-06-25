
// //enpoint for generating signature
// app.post("/api/generate", (req, res) => {
//   const iat = Math.round(new Date().getTime() / 1000) - 30;
//   const exp = iat + 60 * 60 * 2;
//   const oHeader = { alg: "HS256", typ: "JWT" };
//   console.log(req.body);

//   const oPayload = {
//     sdkKey: Zoom_cred_sdk.SDK.KEY,
//     appKey: Zoom_cred_sdk.SDK.KEY,
//     mn: req.body.meetingNumber,
//     role: req.body.role,
//     iat: iat,
//     exp: exp,
//     tokenExp: exp,
//   };

//   const sHeader = JSON.stringify(oHeader);
//   const sPayload = JSON.stringify(oPayload);
//   const sdkJWT = KJUR.jws.JWS.sign(
//     "HS256",
//     sHeader,
//     sPayload,
//     Zoom_cred_sdk.SDK.SECRET
//   );
//   console.log("Signature is" + sdkJWT);
//   res.json({ sdkJWT });
// });

// //generate authorization code
// app.get("/api/authorize", (req, res) => {
//   // Redirect the user to the Zoom authorization URL
//   const queryParams = querystring.stringify({
//     response_type: "code",
//     client_id: Zoom_cred_server.SDK.KEY,
//     redirect_uri: `${frontEndUrl}/Zoommeetstart`,
//   });
//   const authorizationUrl = `https://zoom.us/oauth/authorize?${queryParams}`;
//   console.log(authorizationUrl);
//   // res.redirect(authorizationUrl);
//   res.json({ authorizationUrl });
// });

// //get access token in exchange for auth code
// app.post("/api/callback", async (req, res) =>{

//   // const { code } = req.body.code;
//   console.log(req)
//   const code = req.body.code;
//   console.log("code is" + code);
//   //creating authorization header
//   const clientId = Zoom_cred_server.SDK.KEY;
//   const clientSecret = Zoom_cred_server.SDK.SECRET;

//   const credentials = `${clientId}:${clientSecret}`;
//   const encodedCredentials = Buffer.from(credentials).toString("base64");
//   const authorizationHeader = "Basic "+encodedCredentials;

//   console.log(authorizationHeader);

//   try {
//     // Exchange the authorization code for an access token
//     const response = await fetch("https://zoom.us/oauth/token", {
//       method: "POST",
//       headers: {
//         "Host": "zoom.us",
//         "Authorization" : authorizationHeader,
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: querystring.stringify({
//         grant_type: "authorization_code",
//         client_id: Zoom_cred_server.SDK.KEY,
//         client_secret: Zoom_cred_server.SDK.SECRET,
//         code,
//         redirect_uri: `${frontEndUrl}/Zoommeetstart`
//       }),
//     })

//     if (response.ok) {
//       const { access_token } = await response.json();

//       // Send back the authorization code and access token as the response
//       res.json({ code, access_token });
//       // res.json({response})
//     } else {
//       console.error("Failed to exchange authorization code for access token");
//       res
//         .status(510)
//         .json({
//           error: "Failed to exchange authorization code for access token",
//         });
//     }
//   } catch (error) {
//     console.error(
//       "Failed to exchange authorization code for access token:",
//       error
//     );
//     // res
//     //   .status(500)
//     //   .json({
//     //     error: "Failed to exchange authorization code for access token",
//     //   });
//   }
// });

// //endpoint for starting a meet
// app.post("/api/start-meet", async (req, res) => {
//   try {
//     // Make a POST request to the Zoom API's "start meeting" endpoint
//     const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
//       method: "POST",
//       headers: {
//         "Authorization":`Bearer ${req.body.accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
        
//           "topic": "test",
//           "type":2,
//           "start_time": "2023-06-9T18:40:10Z",
//           "duration":"3",
//           "settings":{
//            "host_video  ":true,
//            "participant_video":true,
//            "join_before_host":true,
//            "mute_upon_entry":"true",
//            "watermark": "true",
//            "audio": "voip",
//            "auto_recording": "local"
//              }
//       }),
//     });

//     // Check if the request was successful
//     if (response.ok) {
//       // Extract the meeting URL from the response
//       const result = await response.json();
//       // console.log(result);
//       await User.updateOne(
//         { userId: result.host_id },
//         { $push: { meetings: { meetingId: result.id }} }
//       );
//       res.json({ result: result });
//     } else {
//       // Handle Zoom API error response
//       const errorData = await response.json();
//       console.error("Error starting meeting:", errorData);
//       res.status(response.status).json({ error: "Failed to start meeting" });
//     }
//   } catch (error) {
//     // Handle any errors that occurred during the API call
//     console.error("Error starting meeting:", error);
//     res.status(500).json({ error: "Failed to start meeting" });
//   }
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });


// app.post("/api/getRecordings", async (req, res) => {
//   try {
//     // Make a GET request to the Zoom API's "list recordings" endpoint
//     const response = await fetch(
//       `https://api.zoom.us/v2/users/me/recordings?page_size=30`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${req.body.access_token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // Check if the request was successful
//     if (response.ok) {
//       // Extract the meeting URL from the response
//       const { recordings } = await response.json();

//       // Send the meeting URL as the API response
//       res.json({ recordings });
//     } else {
//       // Handle Zoom API error response
//       const errorData = await response.json();
//       console.error("Error starting meeting:", errorData);
//       res.status(response.status).json({ error: "Failed to start meeting" });
//     }
//   } catch (error) {
//     // Handle any errors that occurred during the API call
//     console.error("Error starting meeting:", error);
//     res.status(500).json({ error: "Failed to start meeting" });
//   }
// }
// );

// //create zoom api to join meet
// app.post("/api/join-meet", async (req, res) => {
//   try {
//     // Make a POST request to the Zoom API's "start meeting" endpoint
//     const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
//       method: "POST",
//       headers: {
//         "Authorization":`Bearer ${req.body.accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
        
//           "topic": "test",
//           "type":2,
//           "start_time": "2023-06-9T18:40:10Z",
//           "duration":"3",
//           "settings":{
//            "host_video  ":true,
//            "participant_video":true,
//            "join_before_host":true,
//            "mute_upon_entry":"true",
//            "watermark": "true",
//            "audio": "voip",
//            "auto_recording": "cloud"
//              }
//       }),
//     });

//     // Check if the request was successful
//     if (response.ok) {
//       // Extract the meeting URL from the response
//       const result = await response.json();

//       // Send the meeting URL as the API response
//       res.json({ result: result });
//     } else {
//       // Handle Zoom API error response
//       const errorData = await response.json();
//       console.error("Error starting meeting:", errorData);
//       res.status(response.status).json({ error: "Failed to start meeting" });
//     }
//   } catch (error) {
//     // Handle any errors that occurred during the API call
//     console.error("Error starting meeting:", error);
//     res.status(500).json({ error: "Failed to start meeting" });
//   }
// }
// );

// app.post("/api/zoomLogin", (req, res) => {
//   let params;
//   const email = req.body.email;
//   if (req.body.operation) {
//     params = "response_type=code&client_id="+Zoom_cred_server.SDK.KEY+`&redirect_uri=${frontEndUrl}/login`
//   }else{
//     params = "response_type=code&client_id="+Zoom_cred_server.SDK.KEY+`&redirect_uri=${frontEndUrl}/login`;
//   }
//     // console.log(params);
//   res.json(
//     `https://zoom.us/oauth/authorize?${params}` 
//     );
// }
// );

// app.post("/api/accessToken", async (req, res) =>{

//   const code = req.body.code;
//   // console.log("code is" + code);
//   //creating authorization header
//   const clientId = Zoom_cred_server.SDK.KEY;
//   const clientSecret = Zoom_cred_server.SDK.SECRET;

//   const credentials = `${clientId}:${clientSecret}`;
//   const encodedCredentials = Buffer.from(credentials).toString("base64");
//   const authorizationHeader = "Basic "+encodedCredentials;
//   const email = req.body.email;
//   console.log(req.body);

//   if(req.body.operation === "signup"){
//     var redirect_uri = `${frontEndUrl}register?operation=google`;
//   }else{
//     var redirect_uri = `${frontEndUrl}/login`;
//   }

//   // console.log(authorizationHeader);

//   try {
//     // Exchange the authorization code for an access token
//     const response = await fetch("https://zoom.us/oauth/token", {
//       method: "POST",
//       headers: {
//         "Host": "zoom.us",
//         "Authorization" : authorizationHeader,
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: querystring.stringify({
//         code: code,
//         grant_type: "authorization_code",
//         redirect_uri: redirect_uri,
//       }),
//     })
//     console.log(response);
//     if (response.ok) {
//       const { access_token,refresh_token,expires_in } = await response.json();
//       // Calculate expiration time
//       const now = new Date();
//       const expiryTime = new Date(now.getTime() + expires_in * 1000);

//       const result = await fetch("https://api.zoom.us/v2/users/me", {
//       method: "GET",
//       headers: {
//         "Authorization":`Bearer ${access_token}`,
//         "Content-Type": "application/json",
//         },
//       });

//       if (result.ok) {
//         console.log("result is ok");
//         const data = await result.json();
//         if(email){
//           const user = await User.findOne({email: email});
//           console.log(user);
//           console.log("update user");
//           if(user === null){
//             const newUser = {
//               userId: data.id,
//               zoomEmail: data.email,
//               email: email,
//               username: data.first_name + " " + data.last_name,
//               provider: "Salesine",
//               meetings: [],
//               accessToken: access_token,
//               refreshToken: refresh_token,
//               tokenExpiry: expiryTime,
//               verified: true,
//               role: "user",
//               createdAt: new Date(),
//               organization: [],
//               sales: {
//                 total: 0,
//                 active: 0,
//                 closed: 0,
//               }
//             };
//             User.create(newUser).then(()=> console.log("Created Successfully"))
//           }else{
//             User.findOneAndUpdate(
//               { email: email },
//               {
//                 accessToken: access_token,
//                 refreshToken: refresh_token,
//                 tokenExpiry: expiryTime,
//               },
//               { new: true }
//             ).then((user) => {
//               console.log("Updated Successfully");
//             });
//           }
//         }else{
//           const user = await User.findOne({email: data.email})
//           if(user === null){
//             const newUser = {
//               userId: data.id,
//               zoomEmail: data.email,
//               email: data.email,
//               username: data.display_name,
//               provider: "Zoom",
//               meetings: [],
//               accessToken: access_token,
//               refreshToken: refresh_token,
//               tokenExpiry: expiryTime,
//               verified: true,
//               role: "user",
//               createdAt: new Date(),
//               organization: [],
//               sales: {
//                 total: 0,
//                 active: 0,
//                 closed: 0,
//               }
//             };
//             User.create(newUser).then(()=> console.log("Created Successfully"))
//           }else{
//             User.findOneAndUpdate(
//               { email: data.email },
//               {
//                 accessToken: access_token,
//                 refreshToken: refresh_token,
//                 tokenExpiry: expiryTime,
//               },
//               { new: true }
//             )
//               .then(updatedUser => {
//                 // console.log("Updated user:", updatedUser);
//               })
//               .catch(err => {
//                 console.error("Error updating user:", err);
//               });
//           }
//         }
//       }
//       else{
//         const errorData = await response.json();
//         console.error("Error starting meeting:", errorData);
//         res.status(response.status).json({ error: "Failed to start meeting" });
//       }

//       res.json({ access_token,refresh_token,expiryTime });

//     } else {
//       console.error("Failed to exchange authorization code for access token");
//       res
//         .status(510)
//         .json({
//           error: "Failed to exchange authorization code for access token",
//         });
//     }
//   } catch (error) {
//     console.error(
//       "Failed to exchange authorization code for access token:",
//       error
//     );
//   }
// });

// app.post("/api/newAccessToken", async (req, res) =>{
//     // const { code } = req.body.code;
//   console.log(req)
//   const code = req.body.refreshToken;
//   console.log("code is" + code);
//   //creating authorization header
//   const clientId = Zoom_cred_server.SDK.KEY;
//   const clientSecret = Zoom_cred_server.SDK.SECRET;

//   const credentials = `${clientId}:${clientSecret}`;
//   const encodedCredentials = Buffer.from(credentials).toString("base64");
//   const authorizationHeader = "Basic "+encodedCredentials;

//   console.log(authorizationHeader);

//   try{
//     const response = await fetch("https://zoom.us/oauth/token", {
//       method: "POST",
//       headers: {
//         "Host": "zoom.us",
//         "Authorization" : authorizationHeader,
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: querystring.stringify({
//         grant_type: "refresh_token",
//         refresh_token: req.body.refresh_token,
//       }),
//     })
//     if (response.ok) {
//       const { access_token,refresh_token,expires_in } = await response.json();
//       res.json({ access_token,refresh_token,expires_in });

//     } else {
//       console.error("Failed to exchange authorization code for access token");
//       res
//         .status(510)
//         .json({
//           error: "Failed to exchange authorization code for access token",
//         });
//     }
//   }catch(error){
//     console.error(
//       "Failed to exchange authorization code for access token:",
//       error
//     );
//   }
// });

// app.post("api/user", async (req, res) => {
//   try{
//     const response = await fetch("https://api.zoom.us/v2/users/me", {
//       method: "GET",
//       headers: {
//         "Authorization":`Bearer ${req.body.accessToken}`,
//         "Content-Type": "application/json",
//       },
//     });
//     if (response.ok) {
//       const result = await response.json();
//       //TO DO:adding user data to database
//       res.json({ result: result });
//     }
//     else{
//       const errorData = await response.json();
//       console.error("Error starting meeting:", errorData);
//       res.status(response.status).json({ error: "Failed to start meeting" });
//     }
//   }catch(error){
//     console.error(
//       "Failed to exchange authorization code for access token:",
//       error
//     );
//   }
// });

// app.post("/api/salestineLogin", async (req, res) => {
//   try{
//     const user = await User.findOne({email: req.body.email})
//     const Zoomuser = await User.findOne({zoomEmail: req.body.email})
//     console.log(user)
//     if(!user){
//       if(!Zoomuser){
//         console.log("User found")
//         res.status(404).json({ error: "User not found", success: false });
//       }
//     }
//     else{
//       if(user.provider === "Zoom" || Zoomuser.provider === "Zoom"){
//         res.status(400).json({ error: "Zoom Account", success: true });
//       }
//       else{
//         if(user.password === req.body.password){
//           res.json({
//                     access_token: user.accessToken,
//                     refresh_token: user.refreshToken,
//                     expiryTime: user.tokenExpiry,
//                     success: true,
//                   });
//         }
//         else{
//           res.status(400).json({ error: "Incorrect password", success: false });
//         }
//       }
//     }
//   }
//   catch(error){
//     console.error(
//       "Failed to exchange authorization code for access token:",
//       error
//     );
//   }
// });

// app.post("/api/storeMeetId", async (req, res) => {
//   try{
//     const meetingId = req.body.meetingNumber;
//     const email = req.body.email;
//     console.log(meetingId)
//     await User.updateOne(
//       { email: email },
//       { $push: { meetings: { meetingId: result.id }} }
//     );
//   }catch(error){
//     console.error(
//       "Failed to store",
//       error
//     );
//   }
// });

// app.post("/api/updateDb", async (req, res) => {
//   try{
//     const accessToken = req.body.accessToken;
//     const refreshToken = req.body.refreshToken;
//     const expiryTime = req.body.expiresIn;
//     const email = req.body.email;
//     console.log("inside update db")
//     fetch("https://api.zoom.us/v2/users/me", {
//       method: "GET",
//       headers: {
//         "Authorization":`Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//         },
//       }).then(async (response) => {
//         if (response.ok) {
//           const result = await response.json();
//           console.log(result)
//           await User.updateOne(
//             { email: email },
//             { $set: { zoomEmail: result.email,userId:result.id , accessToken:accessToken, refreshToken:refreshToken, tokenExpiry:expiryTime } }
//           );
//           res.json({ result: result });
//         }
//         else{
//           const errorData = await  response.json();
//           console.error("Error starting meeting:", errorData);
//           res.status(response.status).json({ error: "Failed to start meeting" });
//         }
//       })
//   }catch(error){
//     console.error(
//       "Failed to store",
//       error
//     );
//   }
// });

// app.post("/api/googleCalender", async (req, res) => {
//   try{
//     const url=googlefunc();
//     res.json({url:url})
//   }catch(error){
//     console.error(
//       "Failed to store",
//       error
//     );
//   }
// });

// app.post("/api/googleCalenderCode", async (req, res) => {
//   try{
//     console.log("googlecc")
//     updateToken(req.body.code,req.body.email);
//   }catch(error){
//     console.error(
//       "Failed to store",
//       error
//     );
//   }
// });

// app.post("/api/getUserDetails", async (req, res) => {
//   try{
//     console.log("getUserDetails")
//     const at = req.body.accessToken;
//     const result = await fetch("https://api.zoom.us/v2/users/me", {
//                                         method: "GET",
//                                         headers: {
//                                             "Authorization":`Bearer ${req.body.accessToken}`,
//                                             "Content-Type": "application/json",
//                                             },
//                                         });
//     if(result.ok){
//       const result1 = await result.json();
//       console.log(result1)
//       res.json({data: result1})
//     }
//     else{
//       console.log(await result.json())
//       res.status(400).json({ error: "Failed to get user details", success: false });
//     }
//   }
//   catch(error){
//     console.error(
//       "Failed to store",
//       error
//     );
//   }
// });