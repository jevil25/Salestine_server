const { google } = require('googleapis');
const User = require('./models/User');

let oauth2Client;
const googlefunc = () => {
// Set up OAuth client credentials
const credentials = {
  client_id: '172018680892-6gvojprocrq2ipguofsg5160j8dmsa4j.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: ['https://salestine.vercel.app/']
};

// Create an OAuth2 client
oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

// Generate the consent URL
const consentUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar']
});

// Print the consent URL and instruct the user to visit it
console.log('Visit the following URL to authorize access to the calendar:');
console.log(consentUrl);
return consentUrl;

}

const updateToken = (token,email) => {
    // Once the user grants permission and gets redirected to your redirect URI
    // Exchange the authorization code for an access token
    const code = token;
    oauth2Client.getToken(code, async (err, token) => {
    if (err) {
        console.error('Error retrieving access token:', err);
        return false;
    }

    // Use the access token to make API requests
    oauth2Client.setCredentials(token);
    console.log(token);
    const user = await User.findOneAndUpdate({email: email}, {googleAccessToken: token.access_token, googleRefreshToken: token.refresh_token, googleTokenExpiry: token.expiry_date})
    console.log(user);
    return true;
    // Call the Calendar API to create events or perform other actions
    });

    // Assuming you have the authenticated `oauth2Client` from the previous step

}

const insert = () => {
    // Create an instance of the Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
     // Create a new event
     const event = {
        summary: 'New Event',
        start: {
            dateTime: '2023-06-17T10:00:00',
            timeZone: 'America/New_York',
        },
        end: {
            dateTime: '2023-06-17T11:00:00',
            timeZone: 'America/New_York',
        },
        };
    
        // Insert the event into the user's calendar
        calendar.events.insert({
        calendarId: 'primary', // 'primary' refers to the user's primary calendar
        resource: event,
        }, (err, res) => {
        if (err) {
            console.error('Error creating event:', err);
            return;
        }
        console.log('Event created:', res.data);
        });
}

//export the functions
module.exports = {
    googlefunc,
    updateToken,
    insert
}
