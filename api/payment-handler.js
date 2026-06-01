export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { paymentId, txid, action } = req.body;

    // السيرفر سيحاول قراءة أحد المفتاحين المعتمدين لديك
    const PI_API_KEY = process.env.BRIDGE_PI_API_KEY || process.env.PI_API_KEY;

    if (!PI_API_KEY) {
        return res.status(500).json({ error: 'No API Key found. Ensure BRIDGE_PI_API_KEY or PI_API_KEY is set in Vercel.' });
    }

    if (!paymentId || !action) {
        return res.status(400).json({ error: 'Missing required parameters: paymentId or action' });
    }

    try {
        const baseUrl = "https://api.minepi.com/v2/payments";
        const endpoint = action === 'approve' 
            ? `${baseUrl}/${paymentId}/approve` 
            : `${baseUrl}/${paymentId}/complete`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${PI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: action === 'complete' ? JSON.stringify({ txid }) : null
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error(`Pi API Error (${action}):`, data);
            return res.status(400).json({ error: 'Failed to process payment via Pi API', details: data });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Payment handler internal error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
