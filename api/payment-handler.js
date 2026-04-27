export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { paymentId, txid, action, orderDetails } = req.body;
    const PI_API_KEY = process.env.PI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        if (action === 'approve') {
            await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' }
            });
            return res.status(200).json({ approved: true });
        } 
        
        if (action === 'complete') {
            const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ txid })
            });

            if (piRes.ok) {
                // حفظ الطلب في قاعدة البيانات فور نجاح الدفع
                await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        service: orderDetails.service, // العمود الموجود في صورتك
                        contact_info: orderDetails.contact, // يجب إضافته في Supabase
                        transaction_id: txid
                    })
                });
                return res.status(200).json({ completed: true });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
