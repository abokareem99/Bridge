export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { paymentId, txid, action } = req.body;
    const PI_API_KEY = process.env.PI_API_KEY;

    try {
        // الربط الموحد ليعمل مع أي رابط مرفوع على Vercel
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

        if (!response.ok) throw new Error('Pi API Error');
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
