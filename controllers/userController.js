// controllers/userController.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ถ้า login สำเร็จ ดึงข้อมูล profiles
    const userId = data.user.id;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // อาจจะยังส่งข้อมูล user กลับไป แต่แจ้ง error profile ด้วยก็ได้
      return res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์',
        user: data.user,
        session: data.session
      });
    }

    // ส่งข้อมูล user, session และ profile กลับไป
    return res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: data.user,
      session: data.session,
      profile: profileData,  // ข้อมูลจาก profiles
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
