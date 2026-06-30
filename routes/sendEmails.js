import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@M@thurkayo219901990@@@@1';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'contact@andremed.org';

router.post('/', async (req, res) => {
  try {
    const { recipients, subject, message, adminPassword } = req.body;

    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe administrateur invalide.' });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Aucun destinataire.' });
    }

    if (!BREVO_API_KEY) {
      return res.status(500).json({ error: 'Configuration serveur manquante (BREVO_API_KEY).' });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur Brevo :', data);
      return res.status(500).json({ error: data.message || 'Erreur lors de l\'envoi.' });
    }

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