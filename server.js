<<<<<<< HEAD
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import devisRoutes from './routes/devis.js';
import sendEmailsRoutes from './routes/sendEmails.js'; // <-- AJOUT

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/send-emails', sendEmailsRoutes); // <-- AJOUT

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = 'Andremed Medical';

// Route pour l'envoi groupé (newsletter)
app.post('/api/send-emails', async (req, res) => {
  const { recipients, subject, message, adminPassword } = req.body;

  if (adminPassword !== '@M@thurkayo219901990@@@@1') {
    return res.status(401).json({ error: 'Mot de passe administrateur invalide.' });
  }
  if (!recipients || !recipients.length) {
    return res.status(400).json({ error: 'Liste des destinataires vide.' });
  }
  if (!subject || !message) {
    return res.status(400).json({ error: 'Sujet et message requis.' });
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const email of recipients) {
    const emailContent = {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email }],
      subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>${subject}</h2>
          <p>Bonjour,</p>
          <div>${message.replace(/\n/g, '<br/>')}</div>
          <hr />
          <p style="font-size: 12px; color: #666;">Cet email a été envoyé par Andremed Medical.<br/>
          Si vous ne souhaitez plus recevoir nos communications, contactez-nous à ${FROM_EMAIL}.</p>
        </div>
      `
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify(emailContent)
      });
      const data = await response.json();
      if (response.ok) {
        successCount++;
        console.log(`✅ Email envoyé à ${email}`);
      } else {
        failCount++;
        errors.push({ email, error: data.message || 'Erreur API Brevo' });
        console.error(`❌ Échec pour ${email}:`, data.message);
      }
    } catch (error) {
      failCount++;
      errors.push({ email, error: error.message });
      console.error(`❌ Erreur réseau pour ${email}:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  res.json({ success: true, successCount, failCount, errors });
});

// Votre route existante pour les commandes (conservée)
app.post('/api/send-order-status', async (req, res) => {
  const { order, clientEmail, clientName, newLabel, comment } = req.body;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '"Andremed Medical" <onboarding@resend.dev>',
        to: [clientEmail],
        bcc: ['commercial@andremed.org', 'support@andremed.org', 'direction@andremed.org'],
        subject: `Mise à jour de votre commande #${order.id}`,
        html: `<p>Bonjour ${clientName},</p><p>Le statut de votre commande #${order.id} a changé : <strong>${newLabel}</strong></p><p>${comment || `Votre commande est maintenant : ${newLabel}`}</p><p><strong>Détails :</strong><br/>Date : ${order.date}<br/>Total : ${order.total.toLocaleString()} €</p><p>Suivez l'évolution ici : ${process.env.FRONTEND_URL || 'http://localhost:3000'}/account</p><p>Cordialement,<br/>L'équipe Andremed</p>`
      })
    });
    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, id: data.id });
    } else {
      res.status(500).json({ success: false, error: data });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
>>>>>>> cf2a31b7295ac65cceb32f810c6c6cdd1bcdf027
