const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;

app.use(cors(process.env.FRONTENDURL));
app.use(express.json());
// console.log(Zoom_cred_server.SDK.KEY)

app.use("/", require("./Routes/register"));
app.use("/", require("./Routes/login"));
// Enable JSON body parsing middleware
app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});