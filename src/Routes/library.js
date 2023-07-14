const prisma = require('../utils/db/prisma');
const express = require("express");
const router = express.Router();

//router to get library of a user
router.post("/", async (req, res) => {
    const { email } = req.body;
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
    //check user is admin if soo send library of company
    if(user.role === "ADMIN"){
        //get library of the company
        const folder = await prisma.folder.findMany({
            where: {
                companyId: user.companyId,
            }
        });
        return res.status(200).json({ folder,status: true });
    }
    //check if user is super admin if soo send library of all the companies
    if(user.role === "SUPERADMIN"){
        //get library of the company
        const folder = await prisma.folder.findMany();
        return res.status(200).json({ folder,status: true });
    }
    //get library of the user
    const folder = await prisma.folder.findMany({
        where: {
            userId: user.id,
        }
    });
    if (!folder) {
        return res.status(404).json({ message: "Folder not found.",status: false });
    }
    //return the library
    return res.status(200).json({ folder,status: true });
});

//router to add a file to folder
router.post("/addfile", async (req, res) => {
    const { email, folderId, fileId } = req.body;
    if(!email){
        return res.status(404).json({ message: "Email not found.",status: false });
    }
    if(!folderId){
        return res.status(404).json({ message: "Folder Id not found.",status: false });
    }
    //get user id from email
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found.",status: false });
    }
    //check if folder exists
    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
    });
    if (!folder) {
        return res.status(404).json({ message: "Folder not found.",status: false });
    }
    //check if file exists
    const file = await prisma.file.findUnique({
        where: { id: fileId },
    });
    if (!file) {
        return res.status(404).json({ message: "File not found.",status: false });
    }
    //add file to folder
    const folderUpdate = await prisma.folder.update({
        where: { id: folderId },
        data: {
            file:{
                connect:{
                    id: fileId,
                }
            }
        }
    });
    if (!folderUpdate) {
        return res.status(404).json({ message: "File not added.",status: false });
    }
    //return the folder
    return res.status(200).json({ folderUpdate,status: true });
});

//router to add a folder to library
router.post("/addfolder", async (req, res) => {
    const { email, name, type } = req.body;
    if(!email){
        return res.status(404).json({ message: "Email not found.",status: false });
    }
    if(!name){
        return res.status(404).json({ message: "Folder name not found.",status: false });
    }
    //get user id from email
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found.",status: false });
    }
    //add folder to library
    const folder = await prisma.folder.create({
        data: {
            name,
            type,
            user:{
                connect:{
                    id: user.id,
                }
            },
            Company:{
                connect:{
                    id: user.companyId,
                }
            }
        }
    });
    if (!folder) {
        return res.status(404).json({ message: "Folder not added.",status: false });
    }
    //return the folder
    return res.status(200).json({ folder,status: true });
});

module.exports = router;