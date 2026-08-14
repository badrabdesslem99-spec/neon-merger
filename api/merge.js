export default async function handler(req, res) {
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
    const { wallBase64, neonBase64, wallMimeType, neonMimeType, instructions } = req.body;

    if (!wallBase64 || !neonBase64 || !instructions) {
      return res.status(400).json({ error: 'الصورتان والتعليمات مطلوبة' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح Gemini غير موجود' });
    }

    const wallData = wallBase64.includes(',') ? wallBase64.split(',')[1] : wallBase64;
    const neonData = neonBase64.includes(',') ? neonBase64.split(',')[1] : neonBase64;

    // نموذج الصور (Nano Banana 2)
    const model = 'gemini-2.5-flash-image';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/\( {model}:generateContent?key= \){apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: instructions },
                {
                  inline_data: {
                    mime_type: wallMimeType || 'image/jpeg',
                    data: wallData
                  }
                },
                {
                  inline_data: {
                    mime_type: neonMimeType || 'image/jpeg',
                    data: neonData
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'خطأ من نموذج الصور'
      });
    }

    // البحث عن الصورة في الرد
    let imageBase64 = null;
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
      if (part.inline_data && part.inline_data.data) {
        imageBase64 = part.inline_data.data;
        break;
      }
    }

    if (!imageBase64) {
      return res.status(500).json({ 
        error: 'لم يتم توليد صورة. الرد: ' + JSON.stringify(data).slice(0, 300) 
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${imageBase64}`
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي' });
  }
          }
