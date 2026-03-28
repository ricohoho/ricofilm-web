const Mailjet = require('node-mailjet');
const User = require('../models/user.model');
const Role = require('../models/role.model');

// Initialisation paresseuse : le client est créé au premier appel,
// pas au démarrage du serveur (évite les crashs si les env vars sont absentes).
let _mailjetClient = null;
function getClient() {
  if (!_mailjetClient) {
    if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
      throw new Error('[mail.service] MJ_APIKEY_PUBLIC / MJ_APIKEY_PRIVATE manquants');
    }
    _mailjetClient = Mailjet.apiConnect(
      process.env.MJ_APIKEY_PUBLIC,
      process.env.MJ_APIKEY_PRIVATE
    );
  }
  return _mailjetClient;
}

/**
 * Envoie un mail via MailJet.
 * @param {string|string[]} to - Destinataire(s) : email ou tableau d'emails
 * @param {string} subject - Sujet
 * @param {string} textPart - Corps en texte brut
 * @param {string} [htmlPart] - Corps en HTML (optionnel)
 */
exports.sendMail = async (to, subject, textPart, htmlPart) => {
  const recipients = (Array.isArray(to) ? to : [to]).map(email => ({ Email: email }));

  const response = await getClient().post('send', { version: 'v3.1' }).request({
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
 * Notifie le nouvel utilisateur que sa demande d'inscription est prise en compte.
 * @param {object} user - { username, email }
 */
exports.notifyUserRegistration = async (user) => {
  if (!user.email) return;
  const subject = '[RicoFilm] Votre demande d\'inscription est prise en compte';
  const textPart = [
    `Bonjour ${user.username || ''},`,
    '',
    'Votre demande d\'inscription sur RicoFilm a bien été reçue.',
    'Votre accès sera ouvert au plus vite par un administrateur.',
    '',
    'À bientôt sur RicoFilm !',
  ].join('\n');
  const htmlPart = `
    <p>Bonjour <b>${user.username || ''}</b>,</p>
    <p>Votre demande d'inscription sur <b>RicoFilm</b> a bien été reçue.</p>
    <p>Votre accès sera ouvert au plus vite par un administrateur.</p>
    <p>À bientôt !</p>
  `;
  try {
    await exports.sendMail(user.email, subject, textPart, htmlPart);
    console.log(`[mail.service] Confirmation inscription envoyée à ${user.email}`);
  } catch (err) {
    console.error('[mail.service] Erreur envoi confirmation inscription :', err.message || err);
  }
};

/**
 * Notifie tous les admins qu'un nouveau compte est en attente d'approbation.
 * @param {object} user - { username, email }
 */
exports.notifyAdminsNewUser = async (user) => {
  const adminEmails = await exports.getAdminEmails();
  if (adminEmails.length === 0) {
    console.log('[mail.service] Aucun admin trouvé, notification ignorée.');
    return;
  }
  const subject = `[RicoFilm] Nouvelle demande d'accès de ${user.username || 'inconnu'}`;
  const textPart = [
    'Un nouvel utilisateur vient de s\'inscrire sur RicoFilm et attend votre approbation.',
    '',
    `Nom d'utilisateur : ${user.username || '-'}`,
    `Email             : ${user.email || '-'}`,
    '',
    'Rendez-vous dans la liste des utilisateurs pour activer ce compte.',
  ].join('\n');
  const htmlPart = `
    <p>Un nouvel utilisateur vient de s'inscrire sur <b>RicoFilm</b> et attend votre approbation.</p>
    <table cellpadding="6" style="border-collapse:collapse;">
      <tr><td><b>Nom d'utilisateur</b></td><td>${user.username || '-'}</td></tr>
      <tr><td><b>Email</b></td><td>${user.email || '-'}</td></tr>
    </table>
    <p>Rendez-vous dans la liste des utilisateurs pour activer ce compte.</p>
  `;
  try {
    await exports.sendMail(adminEmails, subject, textPart, htmlPart);
    console.log(`[mail.service] Notification nouvel utilisateur envoyée aux admins : ${adminEmails.join(', ')}`);
  } catch (err) {
    console.error('[mail.service] Erreur envoi notification admin (nouvel user) :', err.message || err);
  }
};

/**
 * Notifie un utilisateur que son compte vient d'être activé.
 * @param {object} user - { username, email }
 */
exports.notifyUserAccountActivated = async (user) => {
  if (!user.email) return;
  const subject = '[RicoFilm] Votre accès a été activé !';
  const textPart = [
    `Bonjour ${user.username || ''},`,
    '',
    'Bonne nouvelle ! Votre compte RicoFilm vient d\'être activé par un administrateur.',
    'Vous pouvez maintenant vous connecter et profiter de l\'application.',
    '',
    'À très bientôt sur RicoFilm !',
  ].join('\n');
  const htmlPart = `
    <p>Bonjour <b>${user.username || ''}</b>,</p>
    <p>Bonne nouvelle ! Votre compte <b>RicoFilm</b> vient d'être activé par un administrateur.</p>
    <p>Vous pouvez maintenant vous connecter et profiter de l'application.</p>
    <p>À très bientôt !</p>
  `;
  try {
    await exports.sendMail(user.email, subject, textPart, htmlPart);
    console.log(`[mail.service] Notification activation envoyée à ${user.email}`);
  } catch (err) {
    console.error('[mail.service] Erreur envoi notification activation :', err.message || err);
  }
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
