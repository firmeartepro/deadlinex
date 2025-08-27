const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, email, name, deadline } = req.body;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'Brevo API key not configured' });
  }

  try {
    let subject, htmlContent;

    if (type === 'welcome') {
      subject = 'Bem-vindo ao DeadlineX! 🎉';
      htmlContent = `
        <h2>Olá ${name}!</h2>
        <p>Bem-vindo ao <strong>DeadlineX</strong>! 🚀</p>
        <p>Agora você nunca mais vai perder um prazo importante!</p>
        <p>Comece adicionando seus primeiros prazos e configure os alertas.</p>
        <p>Qualquer dúvida, estamos aqui para ajudar!</p>
        <br>
        <p>Equipe DeadlineX</p>
      `;
    } else if (type === 'deadline-alert') {
      const days = Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24));
      let urgencyText = '';
      
      if (days < 0) {
        urgencyText = `⚠️ VENCEU há ${Math.abs(days)} dia(s)!`;
      } else if (days === 0) {
        urgencyText = '🚨 VENCE HOJE!';
      } else if (days <= 3) {
        urgencyText = `⏰ Vence em ${days} dia(s)!`;
      }

      subject = `DeadlineX: ${deadline.title} - ${urgencyText}`;
      htmlContent = `
        <h2>🔔 Alerta de Prazo!</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin: 0;">${deadline.title}</h3>
          <p style="margin: 10px 0;"><strong>Data:</strong> ${new Date(deadline.date).toLocaleDateString('pt-BR')}</p>
          <p style="margin: 10px 0;"><strong>Status:</strong> ${urgencyText}</p>
          ${deadline.description ? `<p style="margin: 10px 0;"><strong>Descrição:</strong> ${deadline.description}</p>` : ''}
        </div>
        <p>Acesse o <a href="${process.env.SITE_URL}">DeadlineX</a> para gerenciar seus prazos.</p>
        <p>Equipe DeadlineX</p>
      `;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'DeadlineX',
          email: 'noreply@deadlinex.com'
        },
        to: [{
          email: email,
          name: name
        }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
