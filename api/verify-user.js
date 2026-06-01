export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { accessToken, appType } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Missing access token' });
    }

    let PI_API_KEY;
    if (appType === 'bridge') {
        PI_API_KEY = process.env.BRIDGE_PI_API_KEY || process.env.PI_API_KEY;
    } else {
        PI_API_KEY = process.env.PI_API_KEY || process.env.BRIDGE_PI_API_KEY;
    }

    try {
        const response = await fetch("https://api.minepi.com/v2/me", {
            method: 'GET',
            headers: {
                'Authorization': `Key ${PI_API_KEY}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid token validation with Pi API', details: data });
        }

        return res.status(200).json({ success: true, user: data });

    } catch (error) {
        console.error("User validation internal error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
