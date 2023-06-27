const prism = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body);
  let meet_id = req.body.meet_id;
  const meeting = await prism.meeting.findUnique({
    where: {
        meetid: meet_id,
        },
    include: {
        comments: true,
        },
    });

  if (!meeting) {
    return res.status(404).json({ message: "Meeting not found" });
  } 
  else {
    if (req.body.flag == "send") {
      let author = req.body.author;
      let text = req.body.text;
      let timestamp = Date.now();
      try {
        const updatedMeeting = await prism.meeting.update({
            where: {
                id: meet_id,
            },
            data: {
                comments: {
                    create: {
                        author: author,
                        text: text,
                        timestamp: timestamp,
                    },
                },
            },
            include: {
                comments: true,
            },
        });

        return res
          .status(200)
          .json({ message: "Message sent successfully", updatedMeeting });
      } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ message: "Server error" });
      }
    } 
    else if (req.body.flag == "delete") {
      let commentid = req.body.id;
      let email = req.body.email;

   try{
    const meet = await prism.meeting.update({
        where: {
            id: meet_id,
        },
        data: {
            comments: {
                delete: {
                    id: commentid,
                }
            }
        },
        include: {
            comments: true,
        },
    });
      if (!meet) {
        return res.status(400).json({ err: "Comment not found" });
      } else {
        return res.status(200).json(meet);
      }
    }catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    }
  }
}

module.exports = handler;
