import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { name, email, message, userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const clientId = userId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const text = `📩 NOUVEAU MESSAGE

🆔 ID: ${clientId}
👤 Nom: ${name || 'Non renseigné'}
📧 Email: ${email || 'Non renseigné'}
💬 Message: ${message}

📅 ${new Date().toLocaleString('fr-FR')}

⚠️ POUR RÉPONDRE, TAPEZ:
/reply_${clientId} Votre message ici`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_GROUP_CHAT_ID,
        text,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ success: true, userId: clientId });
    } else {
      res.status(500).json({ error: data.description || 'Erreur Telegram' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/updates', async (req, res) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;