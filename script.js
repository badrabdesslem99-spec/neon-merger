// عناصر الواجهة
const wallInput = document.getElementById('wallImage');
const neonInput = document.getElementById('neonImage');
const wallPreview = document.getElementById('wallPreview');
const neonPreview = document.getElementById('neonPreview');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');

// متغيرات لتخزين كود الصور
let wallBase64 = null;
let neonBase64 = null;
let wallMimeType = 'image/jpeg';
let neonMimeType = 'image/jpeg';

// وظيفة قراءة الصورة وتحويلها إلى Base64 مع التقاط نوع الصورة
function handleFileSelect(file, previewElement, callback) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    previewElement.innerHTML = `<img src="${e.target.result}" alt="معاينة">`;
    callback(e.target.result, file.type || 'image/jpeg');
    checkReadyState();
  };
  reader.readAsDataURL(file);
}

// التنسيق عند اختيار ملف الحائط
wallInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], wallPreview, (data, mime) => {
    wallBase64 = data;
    wallMimeType = mime;
  });
});

// التنسيق عند اختيار ملف النيون
neonInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], neonPreview, (data, mime) => {
    neonBase64 = data;
    neonMimeType = mime;
  });
});

// التحقق من رفع الصورتين لتفعيل الزر
function checkReadyState() {
  if (wallBase64 && neonBase64) {
    mergeBtn.disabled = false;
  }
}

// حدث الضغط على زر الدمج (المرحلة 3: استدعاء Gemini لتحليل الصور)
mergeBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    status.textContent = 'يرجى إدخال مفتاح Gemini API أولاً';
    status.style.color = '#ff6b6b';
    return;
  }

  if (!wallBase64 || !neonBase64) {
    status.textContent = 'يرجى اختيار الصورتين أولاً';
    status.style.color = '#ff6b6b';
    return;
  }

  // تعطيل الزر أثناء العمل
  mergeBtn.disabled = true;
  status.textContent = 'جاري تحليل الصور بواسطة Gemini... يرجى الانتظار';
  status.style.color = '#00ccff';

  try {
    // تنظيف كود Base64 (إزالة البادئة data:image/...;base64,)
    const wallData = wallBase64.split(',')[1];
    const neonData = neonBase64.split(',')[1];

    const promptText = `
أنت خبير في تحرير الصور والواقعية البصرية.
أمامك صورتان:
1. صورة حائط / خلفية المكان.
2. صورة لوحة النيون.

المطلوب منك:
اكتب تعليمات دمج دقيقة جداً ومفصلة يمكن لنموذج توليد صور أن ينفذها مباشرة.
ركز على:
- المكان الأنسب لوضع لوحة النيون على الحائط (الموقع، الارتفاع، المسافة من العناصر المحيطة).
- الحجم المناسب للوحة بالنسبة للحائط.
- زاوية المنظور والواقعية.
- الإضاءة والانعكاسات والظلال التي يجب أن تتطابق مع إضاءة الغرفة.
- كيف يجب أن تبدو اللوحة وكأنها جزء حقيقي من المكان.

اكتب التعليمات باللغة الإنجليزية بشكل واضح ومباشر وجاهز للاستخدام كنص prompt.
لا تكتب أي شيء آخر غير التعليمات نفسها.
`;

    // استخدام النموذج المعتمد لمعالجة الصور
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: wallMimeType,
                    data: wallData
                  }
                },
                {
                  inline_data: {
                    mime_type: neonMimeType,
                    data: neonData
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'حدث خطأ أثناء الاتصال بـ Gemini API');
    }

    const instructions = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!instructions) {
      throw new Error('لم يرجع النموذج أي تعليمات، تحقق من الصور والمفتاح.');
    }

    // عرض التعليمات المستخرجة
    status.innerHTML = `
      <div style="text-align: right; background:#1a1a22; padding:15px; border-radius:10px; margin-top:15px; border:1px solid #00ff9d;">
        <strong style="color:#00ff9d;">تعليمات الدمج التي كتبها Gemini:</strong>
        <pre style="white-space: pre-wrap; color:#ddd; margin-top:10px; font-size:13px; text-align:left; dir:ltr;">${instructions}</pre>
      </div>
    `;
    status.style.color = '#00ff9d';

    // حفظ التعليمات للاستخدام في الخطوة التالية
    window.mergeInstructions = instructions;

  } catch (error) {
    console.error(error);
    status.textContent = 'حدث خطأ: ' + error.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});
                
