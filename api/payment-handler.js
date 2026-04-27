import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, txid, action, orderDetails } = req.body;

  try {
    if (action === 'approve') {
      // الموافقة المبدئية على الدفع
      return res.status(200).json({ approved: true });
    }

    if (action === 'complete') {
      // حفظ البيانات في جدول orders في Supabase
      // تأكد أن أسماء الأعمدة تطابق تماماً ما في الجدول
      const { data, error } = await supabase
        .from('orders')
        .insert([
          { 
            pi_payment_id: paymentId, 
            txid: txid, 
            service: orderDetails?.service || 'خدمة غير معروفة', 
            detail: orderDetails?.detail || 'قيد الانتظار', 
            contact: orderDetails?.contact || 'قيد الانتظار' 
          }
        ]);

      if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: 'Database error: ' + error.message });
      }

      return res.status(200).json({ completed: true });
    }

    res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
