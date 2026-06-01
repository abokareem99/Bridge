export default async function handler(req, res) {
    // إضافة ترويسات CORS لضمان قبول الطلبات القادمة من الـ Pi App Studio Sandbox دون مشاكل حظر
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // التعامل التلقائي مع طلبات الاستكشاف الجانبية للـ CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { paymentId, txid, action } = req.body;
    const PI_API_KEY = process.env.PI_API_KEY;

    try {
        const url = action === 'approve' 
            ? `https://api.minepi.com/v2/payments/${paymentId}/approve`
            : `https://api.minepi.com/v2/payments/${paymentId}/complete`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Key ${PI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: action === 'complete' ? JSON.stringify({ txid }) : undefined
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Pi API Error: ${errBody}`);
        }
        
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
