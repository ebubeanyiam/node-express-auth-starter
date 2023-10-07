require("dotenv").config();

export default {
  port: 4000,
  mongoUri: process.env.MONGO_URI,
  env: "development",
  sendgridApiKey: process.env.SENDGRID_API_KEY,
};
