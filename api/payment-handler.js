// ملف معالج الدفع الآمن - Bridge Freelance
// هذا الملف يتم تشغيله على سيرفرات Vercel للتحقق من صحة معاملات Pi Network

export default async function handler(req, res) {
    // السماح فقط بطلبات POST لضمان أمن البيانات
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'الطريقة غير مسموح بها' });
    }

    const { paymentId, txid, action } = req.body;
    
    // جلب مفتاح الـ API من متغيرات البيئة في Vercel لحماية تطبيقك
    const PI_API_KEY = process.env.PI_API_KEY;

    try {
        if (action === 'approve') {
            // الخطوة 1: إبلاغ منصة Pi بأن السيرفر يوافق على بدء هذه المعاملة
            const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('فشل في الموافقة على الدفع من جهة السيرفر');
            }

            return res.status(200).json({ approved: true });
        } 
        
        if (action === 'complete') {
            // الخطوة 2: التأكيد النهائي بعد وصول العملات للبلوكشين وإغلاق المعاملة برمجياً
            const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ txid })
            });

            if (!response.ok) {
                throw new Error('فشل في إتمام المعاملة نهائياً');
            }

            return res.status(200).json({ completed: true });
        }
    } catch (error) {
        console.error("Payment Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
