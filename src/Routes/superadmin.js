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
    const { company_name,email,totalUsers,details,owner_name,owner_email,owner_password, admin_name, admin_email,admin_password } = req.body;
    console.log(req.body);
    if (!company_name || !email || !totalUsers || !details || !owner_name || !owner_email || !owner_password || !admin_name || !admin_email || !admin_password) {
        res.status(404).json({ message: "Company name or email or totalUsers or details or owner name or owner email or owner password or admin name or admin email or admin password not found." });
    }
    //make admin and owner
    const owner = await prisma.user.create({
        data: {
            name: owner_name,
            email: owner_email,
            role: "OWNER",
            password: owner_password
        }
    });
    if (!owner) {
        res.status(404).json({ message: "Owner not found." });
    }
    const admin = await prisma.user.create({
        data: {
            name: admin_name,
            email: admin_email,
            role: "ADMIN",
            password: admin_password
        }
    });
    if (!admin) {
        res.status(404).json({ message: "Admin not found." });
    }
    //make company with owner and admin
    const company = await prisma.company.create({
        data: {
            name: company_name,
            email,
            totalUsers:parseInt(totalUsers),
            details,
            adminId: admin.id,
            ownerId: owner.id,
            users: {
                connect: [
                    { id: owner.id },
                    { id: admin.id }
                ]
            }
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
router.post("/editcompany", async (req, res) => {
    const { company_id, company_name,details,totalUsers,email } = req.body;
    if (!company_id) {
        res.status(404).json({ message: "Company id not found." });
    }
    const company = await prisma.company.update({
        where: { id: company_id },
        data: {
            name: company_name,
            details,
            totalUsers:parseInt(totalUsers),
            email
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
    console.log(req.body);
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
        console.log("user not found");
        const companyNew = await prisma.company.findUnique({
            where: { email:company_email },
        });
        //remove previous owner
        const owner = await prisma.user.findFirst({
            where: { companyId:companyNew.id, role:"OWNER" },
        });
        if (owner) {
            await prisma.user.update({
                where: { id:owner.id },
                data: {
                    role:"USER"
                }
            });
        };
        //create user
        const user = await prisma.user.create({
            data: {
                name,
                email:user_email,
                role:"OWNER",
                password,
                companyId:companyNew.id
            }
        });
        console.log(user);
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

router.post("/activecompany", async (req, res) => {
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

router.post("/checksuperadmin", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(404).json({ message: "Email not found." });
    }
    const user = await prisma.user.findUnique({
        where: { email:email },
    });
    if (user.role !== "SUPERADMIN") {
        res.status(404).json(false);
        return;
    }
    res.status(200).json(true);
});

module.exports = router;