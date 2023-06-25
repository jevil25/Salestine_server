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
router.post("/getusers", async (req, res) => {
    const { email } = req.body;
    console.log(email);
    if(!email){
        return res.status(404).json({ message: "Email not found.",status: false });
    }
    //get user id from email
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found.",status: false });
    }
    if(user.role !== "ADMIN"){
        return res.status(404).json({ message: "User is not an admin.",status: false });
    }
    console.log(user);
    //get company of the admin
    const company = await prisma.company.findFirst({
        where: { adminId: user.id },
    });
    if (!company) {
        return res.status(404).json({ message: "Company not found.",status: false });
    }
    const company_id = company.id;
    //get all the users of that company
    const users = await prisma.user.findMany({
        where: { companyId : company_id },
    });
    if (!users) {
        return res.status(404).json({ message: "Users not found.",status: false });
    }
    //return the users
    res.status(200).json(users);
});

//add a user to a company and create with email and password given by admin
router.post("/adduser", async (req, res) => {
    const { email, password,name,role,admin_email } = req.body;
    console.log(req.body);
    if(!email || !password || !name || !role || !admin_email){
        return res.status(404).json({ message: "Email or password not found." });
    }
    //get company id of the admin
    const user = await prisma.user.findUnique({
        where: { email: admin_email.adminEmail },
    });
    if (!user) {
        return res.status(404).json({ message: "Admin not found." });
    }
    const company_id = user.companyId;
    //create a user with the given email and password
    const newUser = await prisma.user.create({
        data: {
            email,
            password,
            name,
            role,
            companyId: company_id,
        },
    });
    if (!newUser) {
        return res.status(404).json({ message: "User not created." });
    }
    //return the user
    return res.status(200).json(newUser);
});

//delete a user from a company
router.delete("/deleteuser", async (req, res) => {
    const { email } = req.body;
    console.log(email);
    if(!email){
        return res.status(404).json({ message: "Email not found." });
    }
    //delete the users in array email
    email.map(async (email1) => {
        const user = await prisma.user.delete({
            where: { email:email1 },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
    });
    res.status(200).json({ message: "User deleted." });
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

router.post("/edituser", async (req, res) => {
    const { email, name, role } = req.body;
    if(!email || !name || !role){
        return res.status(404).json({ message: "Email or name or role not found." });
    }
    //update the user
    const user = await prisma.user.update({
        where: { email },
        data: {
            name,
            role,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }
    //return the user
    return res.status(200).json(user);
});

module.exports = router;