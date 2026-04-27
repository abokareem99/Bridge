import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // منع أي طريقة طلب غير POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, txid, action, orderDetails } = req.body;

  try {
    // 1. مرحلة الموافقة (Approval): يجب أن تكون سريعة جداً لعدم انتهاء المهلة
    if (action === 'approve') {
      console.log('Payment Approved for ID:', paymentId);
      return res.status(200).json({ approved: true });
    }

    // 2. مرحلة الإكمال (Completion): هنا يتم الحفظ في Supabase بعد نجاح المعاملة
    if (action === 'complete') {
      if (!txid) {
        return res.status(400).json({ error: 'Missing txid' });
      }

      // محاولة الحفظ في Supabase
      const { error } = await supabase
        .from('orders')
        .insert([
          { 
            pi_payment_id: paymentId, 
            txid: txid, 
            service: orderDetails?.service || 'خدمة غير معروفة', 
            detail: orderDetails?.detail || 'بانتظار التفاصيل', 
            contact: orderDetails?.contact || 'بانتظار الاتصال' 
          }
        ]);

      if (error) {
        console.error('Supabase Save Error:', error.message);
        // حتى لو فشل الحفظ في قاعدة البيانات، نرد بـ true لـ Pi Network 
        // لأن الدفع تم بالفعل على البلوكشين ولا نريد إظهار خطأ للمستخدم
        return res.status(200).json({ completed: true, db_error: error.message });
      }

      return res.status(200).json({ completed: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Critical Server Error:', error);
    // نرد دائماً بحالة نجاح في حال وصلنا لمرحلة الـ complete لضمان تجربة مستخدم سلسة
    return res.status(200).json({ completed: true, warning: 'Processed with catch' });
  }
}
