const mongoose = require('mongoose');

const {Schema} = mongoose;

const UserSchema = new Schema({
  userId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  zoomEmail: { type: String, unique: true },
  username: { type: String, required: true },
  password: { type: String },
  provider: { type:String, default:"Salestine" },
  meetings: [
     {
      meetingId: { type: String, default: "" },
      recordingLink: { type: String, default: "" }
    }
  ],
  accessToken: { type: String, default: "" },
  refreshToken: { type: String, default: "" },
  tokenExpiry: { type: String, default: "" },
  verified: { type: Boolean, default: false },
  role: { type: String, default: 'user', required: true },
  createdAt: { type: Date, default: Date.now },
  organization: {
    type: Array,
    default: []
  },
  sales: {
    type: Object,
    default: {
      total: 0,
      active: 0,
      closed: 0,
    },
  }
});


module.exports = mongoose.model('users',UserSchema)