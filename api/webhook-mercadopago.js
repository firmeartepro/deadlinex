const { createClient } = require('@supabase/supabase-js');
const mercadopago = require('mercadopago');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        mercadopago.configure({
            access_token: process.env.MP_ACCESS_TOKEN
        });

        const { data } = req.body;
        
        if (data && data.id) {
            // Buscar pagamento no Mercado Pago
            const payment = await mercadopago.payment.findById(data.id);
            
            if (payment.body.status === 'approved') {
                const userId = payment.body.external_reference;
                const expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 1);
                
                // Ativar premium no Supabase
                const { error } = await supabase
                    .from('user_settings')
                    .upsert([{
                        user_id: userId,
                        settings: { 
                            premium: true,
                            premium_expires: expirationDate.toISOString(),
                            activated_at: new Date().toISOString()
                        }
                    }]);

                if (error) {
                    console.error('Erro ao ativar premium:', error);
                } else {
                    console.log(`Premium ativado para usuário: ${userId}`);
                }
            }
        }

        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
}
