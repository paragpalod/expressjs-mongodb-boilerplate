const { email } = require('../config');
const Email = require('nodemailer').createTransport({
  service: 'gmail',
  auth: {
    user: email.fromEmail,
    pass: email.secret
  }
});

exports.sendMail = (toAddress) => {
  const subject = 'Add your subject here';// add your subject text here
  const html = '<html><head>add your head tags here</head><body>add your body here</body></html>';// input your html code here to show in the mail
  const text = '';// optional recommended format is html

  // mail object is created  to add the to address, from address , subject and html you can also send text key in this object

  const mailOptions = {
    to: toAddress,
    from: email.from,
    subject
  };
  if (html) {
    mailOptions.html = html;
  }
  if (text) {
    mailOptions.text = text;
  }
  Email.sendMail(mailOptions, function (error) {
    if (error) {
      return error;
    } else {
      console.log('Email sent successfully to: ' + toAddress);
    }
  });
};
