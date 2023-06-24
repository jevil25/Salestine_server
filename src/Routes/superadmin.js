const express = require("express");
const router = express.Router();
const prisma = require("../utils/db/prisma");

router.get("/", (req, res) => {
    res.send("Hello SuperAdmin!");
});

//api to get companys and their admins have same company id
router.get("/getcompanies", async (req, res) => {
    const companies = await prisma.company.findMany({
        include: {
            users: {
                where: { role: "OWNER" }
            }
        }
    });
    if (!companies) {
        res.status(404).json({ message: "Companies not found." });
    }
    res.status(200).json(companies);
});

//api to get all the users of a company
router.get("/getusers", async (req, res) => {
    const { company_id } = req.body;
    if (!company_id) {
        res.status(404).json({ message: "Company id not found." });
    }
    const users = await prisma.user.findMany({
        where: { company_id },
    });
    if (!users) {
        res.status(404).json({ message: "Users not found." });
    }
    res.status(200).json(users);
});

//api to add a company
router.post("/addcompany", async (req, res) => {
    const { company_name } = req.body;
    if (!company_name) {
        res.status(404).json({ message: "Company name not found." });
    }
    const company = await prisma.company.create({
        data: {
            company_name
        }
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    res.status(200).json(company);
});

//api to delete a company
router.delete("/deletecompany", async (req, res) => {
    const { company_id } = req.body;
    if (!company_id) {
        res.status(404).json({ message: "Company id not found." });
    }
    //company is an array
    const company = await prisma.company.deleteMany({
        where: { id: company_id },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    res.status(200).json(company);
});

//api to edit company details
router.put("/editcompany", async (req, res) => {
    const { company_id, company_name,details,totalUsers } = req.body;
    if (!company_id) {
        res.status(404).json({ message: "Company id not found." });
    }
    const company = await prisma.company.update({
        where: { id: company_id },
        data: {
            company_name,
            details,
            totalUsers
        }
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    res.status(200).json(company);
});

//api to make a company active or inactive
router.put("/activecompany", async (req, res) => {
    const { company_id, active } = req.body;
    if (!company_id) {
        res.status(404).json({ message: "Company id not found." });
    }
    const company = await prisma.company.update({
        where: { id: company_id },
        data: {
            active
        }
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
    }
    res.status(200).json(company);
});

router.post("/updateOwner", async (req, res) => {
    const { company_email, user_email, name,password } = req.body;
    if (!company_email || !user_email || !name) {
        res.status(404).json({ message: "Company email or user email or name not found." });
        return;
    }
    //check if company exists
    const company = await prisma.company.findUnique({
        where: { email:company_email },
    });
    if (!company) {
        res.status(404).json({ message: "Company not found." });
        return;
    };
    //check if user exists
    const user = await prisma.user.findUnique({
        where: { email:user_email },
    });
    if (!user) {
        const companyNew = await prisma.company.findUnique({
            where: { email:company_email },
        });
        //remove previous owner
        const owner = await prisma.user.findFirst({
            where: { companyId:companyNew.id, role:"OWNER" },
        });
        if (!owner) {
            res.status(404).json({ message: "Owner not found." });
            return;
        };
        await prisma.user.delete({
            where: { id:owner.id },
        });
        //create user
        const user = await prisma.user.create({
            data: {
                name,
                email:user_email,
                role:"OWNER",
                password
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        };
        //update company
        const company = await prisma.company.update({
            where: { email:company_email },
            data: {
                users: {
                    connect: {
                        id: user.id
                    }
                }
            }
        });
        if (!company) {
            res.status(404).json({ message: "Company not found." });
            return;
        };
    }else{
        //update user
        const user = await prisma.user.update({
            where: { email:user_email },
            data: {
                name,
                password,
                role:"OWNER"
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        };
    }
    res.status(200).json(company);
});

module.exports = router;