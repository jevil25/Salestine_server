const express = require("express");
const multer = require('multer');
const app = express();
const upload = multer();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const prisma = require("./utils/db/prisma");
const job = require("./utils/jobs/index");
const ping = require("./utils/jobs/serverOnline");
const file = require("./utils/jobs/getFiles");
const analysis = require("./utils/jobs/analysis");
const awsfunc = require('./utils/jobs/aws');
const summary = require('./utils/jobs/summarization');

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/register", require("./Routes/register"));
app.use("/login", require("./Routes/login"));
app.use("/calls", require("./Routes/calls"));
app.use("/googleAuth", require("./Routes/googleAuth"));
app.use("/validate", require("./Routes/validate"));
app.use("/admin", require("./Routes/admin"));
app.use("/superadmin", require("./Routes/superadmin"));
app.use("/recordings", require("./Routes/recordings"));
app.use("/googleAccessToken", require("./Routes/googleAccessToken"));
app.use("/sendmessage", require("./Routes/Sendmessage"));
app.use("/getonerecord", require("./Routes/getonerecocord"));
app.use("/calender", require("./Routes/googlecalender"));
app.use("/diarizer", require("./Routes/diarizer"));
app.use("/transcribe", require("./Routes/transcribe"));
app.use("/changepassword",require('./Routes/changepassword'))
app.use("/getVideoLink",require('./Routes/getVideoLink'))
app.use("/voicerec",upload.single('audio_data'),require("./Routes/voicerec"))
app.use("/getUserDetails",require("./Routes/getUserDetails"))
app.use("/crm",require("./Routes/crmauth"))
app.use("/getUserDetailsById",require("./Routes/getUserDetailsById"))
app.use("/getTeamDetails",require("./Routes/getTeamDetails"));
app.use("/library",require("./Routes/library"));
app.use("/getFileDetailsById",require("./Routes/getFileDetailsById"));
app.use("/trim",require("./Routes/trim"));
app.use("/summarization",require("./Routes/summarization"));
app.use("/trackers",require("./Routes/trackers"));
app.use("/dealActivity",require("./Routes/dealActivity"))
app.use("/getCoaching",require("./Routes/coaching"));
app.use("/getIndividualDetails",require("./Routes/getIndividualDetails"));
app.use("/uploadCall",upload.single("file"),require("./Routes/uploadCall"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});
//run the job
if(process.env.ASR_SERVER === "true"){
  // analysis();
  // awsfunc();
  ping();
  // summary();
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});