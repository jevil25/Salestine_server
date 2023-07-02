const { google } = require("googleapis");
const prisma = require("../utils/db/prisma");
const handler = require("../utils/google/getAccessToken");

async function googleCalender(req,res){
  try{
    const { email } = req.body;
    if(!email){
        return res.status(404).json({ message: "Email not found.",status: false });
    }
    await handler(email);
    getCalendar(email);
  }catch(err){
    console.log(err);
  }

async function makeCalendarClient(email) {
    const user = await prisma.user.findUnique({
        where: { email },
    });
  const { clientId, clientSecret, refreshToken } = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: user.googleRefreshToken
  }
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI
    );
    if(!refreshToken){
        return res.send({message: "refresh token not found"})
    }
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const calendarClient = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
  return calendarClient;
}


async function getCalendar(email) {
  const calendarClient = await makeCalendarClient(email);

  const { data: calendars, status } = await calendarClient.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  if (status === 200) {
    // console.log('calendars', calendars);
    const user = await prisma.user.findUnique({
        where: { email },
    });
    //get summary, start, end
    console.log(calendars.items);
    calendars.items.map(async (item) => {
        if(item.description !== undefined)
            if(item.description.includes("Zoom")){
            const topic=item.summary;
            const startTime=item.start.dateTime;
            const createdAt=item.created;
            const updatedAt=item.updated;
            const meetHostId=user.id;
            const link=item.description;
            const meetid=link.split("ID: ")[1].split("Passcode: ")[0].trim().replace(" ","").replace(" ","");
            const meetPassword=link.split("Passcode: ")[1].trim();

            //check if meeting already exists
            let meet = await prisma.meeting.findUnique({
                where: {
                    meetid: meetid,
                },
            });
            console.log(meet);
            if(!meet){
            meet = await prisma.meeting.create({
                data: {
                    topic,
                    startTime,
                    createdAt,
                    updatedAt,
                    meetHostId,
                    meetid,
                    meetPassword,
                    companyid: user.companyId,
                },
            });
            console.log(meet);
        } 
            }
    })
    return res.send({message: "success"});
  } else {
    console.log('there was an issue...', status);
    return {message: "there was an issue..."}
  }

}
}

module.exports = googleCalender;