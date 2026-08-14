export default async function handler(req, res) {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallBase64, neonBase64, wallMimeType, neonMimeType } = req.body;

    if (!wallBase64 || !neonBase64) {
      return res.status(400).json({ error: 'الصورتان مطلوبتان' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح Gemini غير موجود على السيرفر' });
    }

    const wallData = wallBase64.includes(',') ? wallBase64.split(',')[1] : wallBase64;
    const neonData = neonBase64.includes(',') ? neonBase64.split(',')[1] : neonBase64;

    const promptText = `أنت خبير في تحرير الصور والواقعية البصرية. أمامك صورتان: 1. صورة حائط / خلفية المكان 2. صورة لوحة النيون. اكتب تعليمات دمج دقيقة جداً ومفصلة يمكن لنموذج توليد صور أن ينفذها مباشرة.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              { inline_data: { mime_type: wallMimeType || 'image/jpeg', data: wallData } },
              { inline_data: { mime_type: neonMimeType || 'image/jpeg', data: neonData } }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'خطأ من Gemini' });
    }

    const instructions = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم الحصول على تعليمات';

    return res.status(200).json({ instructions });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'حدث خطأ في السيرفر' });
  }
                                                                 }
