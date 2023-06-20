const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
const prisma = require("./utils/db/prisma");

app.use(cors(process.env.FRONTENDURL));
app.use(express.json());
// console.log(Zoom_cred_server.SDK.KEY)

// app.use("/", require("../Routes/register"));
// app.use("/", require("../Routes/login"));
// Enable JSON body parsing middleware
app.use(bodyParser.json());

const main = async () => {
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'adjnajd@gmail.com',
    password: 'jfnskjdf',
    role: "ADMIN",
    token: "ksjdsjkdbjdjsjd",
    companyId: '1'
  },
});
console.log(user)
}
main()
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});