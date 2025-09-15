const mercadopago = require('mercadopago');

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
        // Configurar Mercado Pago
        mercadopago.configure({
            access_token: process.env.MP_ACCESS_TOKEN
        });

        const { userId, userEmail, userName } = req.body;

        const preference = {
            items: [{
                title: 'DeadlineX Premium - Assinatura Mensal',
                description: 'Acesso completo a todas as funcionalidades premium',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 4.90
            }],
            payer: {
                email: userEmail,
                name: userName
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/success`,
                failure: `${process.env.FRONTEND_URL}/failure`,
                pending: `${process.env.FRONTEND_URL}/pending`
            },
            auto_return: 'approved',
            external_reference: userId,
            notification_url: `${process.env.FRONTEND_URL}/api/webhook-mercadopago`
        };

        const response = await mercadopago.preferences.create(preference);
        
        res.json({
            id: response.body.id,
            init_point: response.body.init_point
        });
        
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
