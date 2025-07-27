const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// สร้าง client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function insertimage(req, res) {
  try {
    const { tenant_id, image } = req.body;
    if (!tenant_id || !image) throw new Error("Missing tenant_id or image");

    // แยก base64 ออก
    const [prefix, base64] = image.split(",");
    if (!base64) throw new Error("Invalid base64 data");

    // ตรวจจับ mime type
    const mimeMatch = prefix.match(/data:(.*);base64/);
    if (!mimeMatch) throw new Error("Invalid mime type");
    const mime = mimeMatch[1];
    let ext = "bin";
    if (mime === "image/jpeg") ext = "jpg";
    else if (mime === "image/png") ext = "png";
    else if (mime === "application/pdf") ext = "pdf";

    const buffer = Buffer.from(base64, "base64");

    // ตั้งชื่อไฟล์
    const fileName = `${tenant_id}_${Date.now()}.${ext}`;
    const bucketName = "file"; // ชื่อ bucket ที่คุณสร้างใน Supabase Storage

    // อัปโหลดไฟล์ขึ้น Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // สร้าง public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    // อัปเดตฐานข้อมูล tenants
    const { error: dbError } = await supabase
      .from("tenants")
      .update({ image: publicUrl })
      .eq("id", tenant_id);

    if (dbError) {
      console.error("DB update error:", dbError);
      throw dbError;
    }

    res.json({ status: 200, message: "success", img: publicUrl });
  } catch (err) {
    console.error("insertimage error:", err);
    res.status(500).json({ status: 500, message: err.message });
  }
}

module.exports = { insertimage };
