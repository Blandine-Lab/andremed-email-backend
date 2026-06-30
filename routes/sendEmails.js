import express from 'express';
import fetch from 'node-fetch'; // si vous utilisez Node <18, sinon utilisez global fetch

const router = express.Router();

// Mot de passe admin (depuis les variables d'environnement)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@M@thurkayo219901990@@@@1';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'contact@andremed.org';

router.post('/', async (req, res) => {
  try {
    const { recipients, subject, message, adminPassword } = req.body;

    // 1. Vérifier le mot de passe
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe administrateur invalide.' });
    }

    // 2. Vérifier les champs obligatoires
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Liste de destinataires vide ou invalide.' });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: 'Sujet et message requis.' });
    }

    // 3. Vérifier la clé API Brevo
    if (!BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY manquante dans les variables d\'environnement.');
      return res.status(500).json({ error: 'Configuration serveur manquante.' });
    }

    // 4. Envoyer via l'API Brevo (Sendinblue)
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: 'Andremed Medical' },
        to: recipients.map(email => ({ email })),
        subject: subject,
        htmlContent: message,
      }),
    });

    const data = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Erreur Brevo :', data);
      return res.status(500).json({ error: data.message || 'Erreur lors de l\'envoi.' });
    }

    // 5. Réponse succès
    res.json({
      success: true,
      successCount: recipients.length,
      failCount: 0,
      messageId: data.messageId,
    });
  } catch (error) {
    console.error('Erreur serveur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

export default router;