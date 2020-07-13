require('dotenv').config();

const configuration = {
  serverSecret: process.env.API_SECRET, // change this secret to a 32bit string for jwt token secret
  port: process.env.PORT,
  services: {
    email: {
      fromEmail: process.env.EMAIL_ID, // add your mail id here
      from: `"Team Express Project" ${process.env.EMAIL_ID}`, // this will give your every email a displayname
      secret: process.env.EMAIL_SECRET// secrete key provided by your email service provider
    }
  },
  verificationLink: {
    baseURL: 'http://localhost:3000/auth/verifyUser?token='
  },
  resetPasswordLink: {
    baseURL: 'http://localhost:3000/auth/resetPassword?token='
  },
  appUrl: 'http://localhost:3000/'
};

exports.serverSecret = configuration.serverSecret;
exports.email = configuration.services.email;
exports.verificationLink = configuration.verificationLink;
exports.resetPasswordLink = configuration.resetPasswordLink;
exports.port = configuration.port;
