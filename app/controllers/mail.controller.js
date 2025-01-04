const nodemailer = require('nodemailer');



// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.free.fr', // Remplacez par le nom d'hôte de votre serveur SMTP
  port: 587, // Utilisez le port approprié
  secure: false, // true pour SSL, false pour les autres (comme TLS)
  auth: {
    user: 'kel.fassel@free.fr', // Remplacez par votre adresse e-mail SMTP
    pass: 'm8yq1bvy' // Remplacez par votre mot de passe SMTP
  }
});

// Configuration de l'e-mail
const mailOptions = {
  from: 'kel.fassel@free.fr', // Adresse e-mail de l'expéditeur
  to: 'ricohoho@gmail.com', // Adresse e-mail du destinataire
  subject: 'Test Email via Nodemailer', // Sujet de l'e-mail
  text: 'Hello, this is a test email sent using Nodemailer!', // Contenu de l'e-mail en texte brut
  html: '<h1>Hello</h1><p>This is a test email sent using <b>Nodemailer</b>!</p>' // Contenu de l'e-mail en HTML
};



//Liste des requests 
exports.testMail  = (req, res) => {  
    console.log('testMail');
    // Envoi de l'e-mail
    transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Error occurred while sending email:', error);
    }
    console.log('Email sent successfully:', info.response);
    res.status(200).send("eMail ok");    
    return ;      
  });	

	
};