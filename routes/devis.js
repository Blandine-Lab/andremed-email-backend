import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { firstName, lastName, email, phone, equipmentType, description } = req.body;

  if (!firstName || !email || !description) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const telegramMessage = `📋 **NOUVELLE DEMANDE DE DEVIS**
━━━━━━━━━━━━━━━━━━
👤 Nom: ${firstName} ${lastName}
📞 Téléphone: ${phone || 'Non renseigné'}
✉️ Email: ${email}
🏥 Type d'équipement: ${equipmentType || 'Non précisé'}
📝 Description:
${description}

📅 ${new Date().toLocaleString('fr-FR')}`;

  let telegramOk = false;
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_GROUP_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown',
      }),
    });
    const data = await tgRes.json();
    telegramOk = data.ok;
  } catch (e) {
    console.error('Telegram error:', e);
  }

  // Envoi d'email de confirmation via Web3Forms
  const emailContent = `
    Bonjour ${firstName} ${lastName},
    
    Nous avons bien reçu votre demande de devis pour ${equipmentType || 'matériel médical'}.
    
    Voici le récapitulatif :
    - Nom : ${firstName} ${lastName}
    - Téléphone : ${phone || 'Non renseigné'}
    - Email : ${email}
    - Type d'équipement : ${equipmentType || 'Non précisé'}
    - Description : ${description}
    
    Notre équipe va étudier votre demande et vous recontactera rapidement.
    
    Cordialement,
    L'équipe Andremed Medical
  `;

  const key1 = process.env.WEB3FORMS_ACCESS_KEY1;
  const key2 = process.env.WEB3FORMS_ACCESS_KEY2;

  const sendEmail = async (accessKey) => {
    const formData = new FormData();
    formData.append('access_key', accessKey);
    formData.append('subject', `Demande de devis - ${equipmentType || 'Matériel médical'}`);
    formData.append('to', email);
    formData.append('from_name', 'Andremed Medical');
    formData.append('replyto', 'contact@andremed.org');
    formData.append('message', emailContent);
    try {
      const response = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Web3Forms error:', error);
      return false;
    }
  };

  const emailOk1 = await sendEmail(key1);
  const emailOk2 = await sendEmail(key2);
  const emailOk = emailOk1 && emailOk2;

  if (telegramOk && emailOk) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi' });
  }
});

export default router;