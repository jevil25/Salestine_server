const handler = require("../utils/google/getAccessToken");
const axios = require("axios");

function getVideo(accessToken,id,res) {
    try{
        console.log("Fetching video from drive");
        axios({
        method: 'POST',
        url: `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        data: {
                role: "reader",
                type: "anyone",
        },
        }).then((response) => {
            console.log(response.data);
            res.status(200).json({ message:"success" });
        }).catch((error) => {
            console.log(error);
            res.status(400).json({ error: "Error fetching video" });
        });
    }catch(err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
}

    async function getVideoLink(req, res) {
        const id = req.body.id;
        if(!id) {
            console.log("Missing video id");
            res.status(400).json({ error: "Missing video id" });
            return;
        }
        const accessToken = await handler(process.env.DRIVE_EMAIL);

        if(!accessToken) {
            console.log("Invalid access token");
        res.status(401).json({ error: "Invalid access token" });
        return;
        }
        getVideo(accessToken,id,res);
  }

 module.exports = getVideoLink; 