const axios = require('axios');

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, phoneNumber } = req.body;

        const response = await axios.post(
            'https://evolution-api.com/api/message/sendText',
            {
                number: phoneNumber,
                text: message
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`
                }
            }
        );

        res.json({ success: true, data: response.data });
        
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
}
