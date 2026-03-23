const Mailjet = require('node-mailjet');
const User = require('../models/user.model');
const Role = require('../models/role.model');

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

/**
 * Envoie un mail via MailJet.
 * @param {string|string[]} to - Destinataire(s) : email ou tableau d'emails
 * @param {string} subject - Sujet
 * @param {string} textPart - Corps en texte brut
 * @param {string} [htmlPart] - Corps en HTML (optionnel)
 */
exports.sendMail = async (to, subject, textPart, htmlPart) => {
  const recipients = (Array.isArray(to) ? to : [to]).map(email => ({ Email: email }));

  const response = await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: process.env.MJ_SENDER_EMAIL,
          Name: process.env.MJ_SENDER_NAME || 'RicoFilm'
        },
        To: recipients,
        Subject: subject,
        TextPart: textPart,
        ...(htmlPart && { HTMLPart: htmlPart })
      }
    ]
  });

  return response.body;
};

/**
 * Retourne les emails de tous les utilisateurs ayant le rôle "admin".
 * @returns {Promise<string[]>}
 */
exports.getAdminEmails = async () => {
  const adminRole = await Role.findOne({ name: 'admin' });
  if (!adminRole) return [];
  const admins = await User.find({ roles: adminRole._id, active: true }, 'email');
  return admins.map(u => u.email).filter(Boolean);
};

/**
 * Notifie tous les admins de la création d'une nouvelle demande.
 * @param {object} request - L'objet demande inséré
 */
exports.notifyAdminsNewRequest = async (request) => {
  const adminEmails = await exports.getAdminEmails();
  if (adminEmails.length === 0) {
    console.log('[mail.service] Aucun admin trouvé, notification ignorée.');
    return;
  }

  const subject = `[RicoFilm] Nouvelle demande de ${request.username || 'inconnu'}`;

  const textPart = [
    'Une nouvelle demande a été créée sur RicoFilm.',
    '',
    `Utilisateur : ${request.username || '-'}`,
    `Titre       : ${request.title || '-'}`,
    `Fichier     : ${request.file || '-'}`,
    `Serveur     : ${request.serveur_name || '-'}`,
    `Taille      : ${request.size || '-'}`,
    `Statut      : ${request.status || 'AFAIRE'}`,
  ].join('\n');

  const htmlPart = `
    <h2>Nouvelle demande RicoFilm</h2>
    <table cellpadding="6" style="border-collapse:collapse;">
      <tr><td><b>Utilisateur</b></td><td>${request.username || '-'}</td></tr>
      <tr><td><b>Titre</b></td><td>${request.title || '-'}</td></tr>
      <tr><td><b>Fichier</b></td><td>${request.file || '-'}</td></tr>
      <tr><td><b>Serveur</b></td><td>${request.serveur_name || '-'}</td></tr>
      <tr><td><b>Taille</b></td><td>${request.size || '-'}</td></tr>
      <tr><td><b>Statut</b></td><td>${request.status || 'AFAIRE'}</td></tr>
    </table>
  `;

  try {
    await exports.sendMail(adminEmails, subject, textPart, htmlPart);
    console.log(`[mail.service] Notification envoyée aux admins : ${adminEmails.join(', ')}`);
  } catch (err) {
    console.error('[mail.service] Erreur envoi notification admin :', err.message || err);
  }
};
