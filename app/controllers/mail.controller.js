const nodemailer = require('nodemailer');



// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({

  host: process.env.SMTP_HOST, // Remplacez par le nom d'hôte de votre serveur SMTP
  port: process.env.SMTP_PORT, // Utilisez le port approprié
  secure: false, // true pour SSL, false pour les autres (comme TLS)
  auth: {
    user: process.env.SMTP_USER, // Remplacez par votre adresse e-mail SMTP
    pass: process.env.SMTP_PASS // Remplacez par votre mot de passe SMTP
  }
});

// Configuration de l'e-mail
const mailOptions = {
  from: process.env.MAIL_FROM, // Adresse e-mail de l'expéditeur
  to: 'ricohoho@gmail.com', // Adresse e-mail du destinataire
  subject: 'Test Email via Nodemailer', // Sujet de l'e-mail
  text: 'Hello, this is a test email sent using Nodemailer!', // Contenu de l'e-mail en texte brut
  html: '<h1>Hello</h1><p>This is a test email sent using <b>Nodemailer</b>!</p>' // Contenu de l'e-mail en HTML
};



//Liste des requests 
exports.testMail = (req, res) => {
  console.log('testMail');
  // Envoi de l'e-mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Error occurred while sending email:', error);
    }
    console.log('Email sent successfully:', info.response);
    res.status(200).send("eMail ok");
    return;
  });
};

//Envoi d'un mail 
exports.sendMail = (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || !text) {
    return res.status(400).send('Missing required fields: to, subject, text');
  }
  const mailOpts = {
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    ...(html && { html })
  };
  transporter.sendMail(mailOpts, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent successfully:', info.response);
    return res.status(200).send('Email sent');
  });
};