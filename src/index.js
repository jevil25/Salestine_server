const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;
const prisma = require("./utils/db/prisma");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/register", require("./Routes/register"));
app.use("/login", require("./Routes/login"));
app.use("/calls", require("./Routes/calls"));
app.use("/googleAuth", require("./Routes/googleAuth"));
app.use("/test", require("./Routes/test"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});