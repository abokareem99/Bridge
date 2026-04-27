export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { paymentId, txid, action, orderDetails } = req.body;
    
    // تأكد من أسماء هذه المتغيرات في إعدادات Vercel
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
                // محاولة الحفظ في Supabase
                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            detail: orderDetails ? orderDetails.service : "خدمة غير محددة",
                            contact: orderDetails ? orderDetails.contact : "لا توجد بيانات",
                            txid: txid
                        })
                    });
                } catch (dbError) {
                    console.error("Database error:", dbError);
                    // نكمل العملية حتى لو فشل التخزين لكي لا يضيع حق المستخدم في الدفع
                }
                return res.status(200).json({ completed: true });
            } else {
                const errText = await piRes.text();
                return res.status(400).json({ error: errText });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
