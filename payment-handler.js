const https = require('https');

export default async function handler(req, res) {
    // إعداد رؤوس CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { paymentId, txid, action } = req.body;
        const PI_API_KEY = process.env.PI_API_KEY;

        const data = action === 'complete' ? JSON.stringify({ txid }) : JSON.stringify({});
        
        const options = {
            hostname: 'api.minepi.com',
            path: `/v2/payments/${paymentId}/${action}`,
            method: 'POST',
            headers: {
                'Authorization': `Key ${PI_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const result = await new Promise((resolve, reject) => {
            const apiReq = https.request(options, (apiRes) => {
                let resData = '';
                apiRes.on('data', (chunk) => resData += chunk);
                apiRes.on('end', () => resolve({ status: apiRes.statusCode, data: resData }));
            });

            apiReq.on('error', (e) => reject(e));
            apiReq.write(data);
            apiReq.end();
        });

        return res.status(result.status).send(result.data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
