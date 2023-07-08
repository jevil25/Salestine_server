const prism = require("../utils/db/prisma");

async function handler(req, res) {
  console.log(req.body);
  let meet_id = req.body.meet_id;
  if (!meet_id) {
    return res.status(404).json({ message: "Meeting id not found." });
  }
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
        const updatedMeeting = await prism.comment.create({
          data: {
            meetingId: meet_id,
            text: text,
            author: author,
          }
        });

        return res
          .status(200)
          .json({ message: "Message sent successfully", updatedMeeting });
      } catch (error) {
        console.log("Error sending message:", error);
        return res.status(500).json({ message: "Server error" });
      }
    } 
    else if (req.body.flag == "delete") {
      let commentid = req.body.id;

   try{
      const meet = await prism.comment.delete({
        where: {
          id: commentid,
        },
      });
      console.log(meet);
      if (!meet) {
        return res.status(400).json({ err: "Comment not found" });
      } else {
        return res.status(200).json({ message: "Comment deleted successfully"});
      }
    }catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    }
  }
}

module.exports = handler;
