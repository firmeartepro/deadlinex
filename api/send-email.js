const https = require('https');

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, email, name, deadline } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email e nome são obrigatórios' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
  const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME;

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'Configuração de email não encontrada' });
  }

  let subject, htmlContent;

  if (type === 'welcome') {
    subject = 'Bem-vindo ao DeadlineX! 🎉';
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao DeadlineX!</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Nunca mais perca um prazo importante</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Olá, ${name}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Parabéns por se juntar ao DeadlineX! Agora você tem uma ferramenta poderosa para gerenciar todos os seus prazos importantes.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">🚀 Próximos passos:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Adicione seus primeiros prazos</li>
              <li>Configure as categorias que fazem sentido para você</li>
              <li>Ative as notificações por email</li>
              <li>Nunca mais esqueça datas importantes!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://deadlinex.vercel.app" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Começar Agora
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Se você não criou esta conta, pode ignorar este email.
          </p>
        </div>
      </div>
    `;
  } else if (type === 'deadline-alert' && deadline) {
    const days = Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24));
    let urgencyText, urgencyColor;
    
    if (days < 0) {
      urgencyText = `Venceu há ${Math.abs(days)} dia(s)`;
      urgencyColor = '#dc2626';
    } else if (days === 0) {
      urgencyText = 'Vence hoje!';
      urgencyColor = '#dc2626';
    } else if (days <= 3) {
      urgencyText = `Vence em ${days} dia(s)`;
      urgencyColor = '#f59e0b';
    } else {
      urgencyText = `${days} dias restantes`;
      urgencyColor = '#3b82f6';
    }

    subject = `⚠️ Alerta: ${deadline.title} - ${urgencyText}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Alerta de Prazo</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Olá, ${name}!</h2>
          
          <div style="background: #fef2f2; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${deadline.title}</h3>
            <p style="color: #666; margin: 0 0 10px 0;"><strong>Data:</strong> ${new Date(deadline.date).toLocaleDateString('pt-BR')}</p>
            <p style="color: ${urgencyColor}; font-weight: bold; margin: 0;"><strong>Status:</strong> ${urgencyText}</p>
            ${deadline.description ? `<p style="color: #666; margin: 10px 0 0 0;"><strong>Descrição:</strong> ${deadline.description}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://deadlinex.vercel.app" style="background: ${urgencyColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Ver no DeadlineX
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            Para parar de receber estes alertas, acesse suas configurações no DeadlineX.
          </p>
        </div>
      </div>
    `;
  } else {
    return res.status(400).json({ error: 'Tipo de email inválido' });
  }

  const data = JSON.stringify({
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL
    },
    to: [{
      email: email,
      name: name
    }],
    subject: subject,
    htmlContent: htmlContent
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (response) => {
      let responseData = '';
      
      response.on('data', (chunk) => {
        responseData += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 201) {
          res.status(200).json({ success: true, message: 'Email enviado com sucesso' });
        } else {
          console.error('Erro Brevo:', responseData);
          res.status(500).json({ error: 'Erro ao enviar email', details: responseData });
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Erro na requisição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      resolve();
    });

    req.write(data);
    req.end();
  });
}
