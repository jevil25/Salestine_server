const prisma = require("../utils/db/prisma");
const express = require("express");
const router = express.Router();

//creata a rest api to get all the calls of a user of that particular admins company

router.get("/", (req, res) => {
    res.send("Hello Admin!");
});

router.get("/getcalls", async (req, res) => {
    const { email } = req.body;
    if(!email){
        res.status(404).json({ message: "Email not found." });
    }
    //get company id of the admin
    const company = await prisma.company.findUnique({
        where: { email },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    const company_id = company.id;
    //get all the users of that company
    const users = await prisma.user.findMany({
        where: { company_id },
    });
    if (!users) {
        res.status(404).json({ message: "Users not found." });
    }
    //get all the meetings of all the users of that company
    const meetings = await prisma.meeting.findMany({
        where: { user_id: { in: users.map((user) => user.id) } },
    });
    if (!meetings) {
        res.status(404).json({ message: "Meetings not found." });
    }
    //return the meetings
    res.status(200).json(meetings);
});

//get users of a company
router.get("/getusers", async (req, res) => {
    const { email } = req.body;
    if(!email){
        res.status(404).json({ message: "Email not found." });
    }
    //get company id of the admin
    const company = await prisma.company.findUnique({
        where: { email },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    const company_id = company.id;
    //get all the users of that company
    const users = await prisma.user.findMany({
        where: { company_id },
    });
    if (!users) {
        res.status(404).json({ message: "Users not found." });
    }
    //return the users
    res.status(200).json(users);
});

//add a user to a company and create with email and password given by admin
router.post("/adduser", async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password){
        res.status(404).json({ message: "Email or password not found." });
    }
    //get company id of the admin
    const company = await prisma.company.findUnique({
        where: { email },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    const company_id = company.id;
    //create a user with email and password
    const user = await prisma.user.create({
        data: {
            email,
            password,
            company_id,
        },
    });
    if (!user) {
        res.status(404).json({ message: "User not found." });
    }
    //return the user
    res.status(200).json(user);
});

//delete a user from a company
router.delete("/deleteuser", async (req, res) => {
    const { email } = req.body;
    if(!email){
        res.status(404).json({ message: "Email not found." });
    }
    //get company id of the admin
    const company = await prisma.company.findUnique({
        where: { email },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    const company_id = company.id;
    //delete the user
    const user = await prisma.user.delete({
        where: { email },
    });
    if (!user) {
        res.status(404).json({ message: "User not found." });
    }
    //return the user
    res.status(200).json(user);
}); 

router.post("/checkadmin", async (req, res) => {
    const { email } = req.body;
    if(!email){
        res.status(404).json({ message: "Email not found.", status: false });
    }
    //check if role is admin
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        res.status(404).json({ message: "User not found.", status: false });
    }
    if(user.role === "ADMIN"){
        res.status(200).json({ message: "Admin", status: true });
    }
    else{
        res.status(200).json({ message: "Not Admin", status: false });
    }
});

module.exports = router;