const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const prisma = require("./utils/db/prisma");
const job = require("./utils/jobs/index");
const ping = require("./utils/jobs/serverOnline");

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

ping();
//run the job
// job();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});