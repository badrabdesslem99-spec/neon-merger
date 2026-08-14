// عناصر الواجهة
const wallInput = document.getElementById('wallImage');
const neonInput = document.getElementById('neonImage');
const wallPreview = document.getElementById('wallPreview');
const neonPreview = document.getElementById('neonPreview');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');

// متغيرات لتخزين كود الصور ونوعها
let wallBase64 = null;
let neonBase64 = null;
let wallMimeType = 'image/jpeg';
let neonMimeType = 'image/jpeg';

// وظيفة قراءة الصورة وتحويلها إلى Base64
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

// دالة الضغط على زر الدمج (تم تحديثها بالكامل حسب تعليمات Grok)
mergeBtn.addEventListener('click', async () => {
  if (!wallBase64 || !neonBase64) {
    status.textContent = 'يرجى اختيار الصورتين أولاً';
    status.style.color = '#ff6b6b';
    return;
  }

  mergeBtn.disabled = true;
  status.textContent = 'جاري تحليل الصور بواسطة Gemini 3.5...';
  status.style.color = '#00ccff';

  try {
    // ========== الخطوة 1: الحصول على تعليمات الدمج ==========
    const analyzeResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallBase64,
        neonBase64,
        wallMimeType,
        neonMimeType
      })
    });

    const analyzeData = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      throw new Error(analyzeData.error || 'فشل في تحليل الصور');
    }

    const instructions = analyzeData.instructions;
    if (!instructions) {
      throw new Error('لم يتم الحصول على تعليمات');
    }

    // عرض التعليمات مؤقتاً
    status.innerHTML = `
      <div style="text-align:right; background:#1a1a22; padding:12px; border-radius:10px; border:1px solid #00ff9d; margin-bottom:15px;">
        <strong style="color:#00ff9d;">تم تحليل الصور بنجاح</strong>
        <pre style="white-space:pre-wrap; color:#ccc; font-size:12px; margin-top:8px; text-align:left; direction:ltr; max-height:150px; overflow:auto;">${instructions.substring(0, 400)}...</pre>
      </div>
      <div style="color:#00ccff;">جاري توليد الصورة النهائية بواسطة Nano Banana...</div>
    `;

    // ========== الخطوة 2: توليد الصورة النهائية ==========
    const mergeResponse = await fetch('/api/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallBase64,
        neonBase64,
        wallMimeType,
        neonMimeType,
        instructions
      })
    });

    const mergeData = await mergeResponse.json();

    if (!mergeResponse.ok) {
      throw new Error(mergeData.error || 'فشل في توليد الصورة');
    }

    if (!mergeData.image) {
      throw new Error('لم يتم إرجاع صورة من النموذج');
    }

    // عرض النتيجة النهائية
    resultImage.src = mergeData.image;
    downloadBtn.href = mergeData.image;
    resultSection.style.display = 'block';

    status.innerHTML = `<div style="color:#00ff9d; font-weight:bold;">تم الدمج بنجاح!</div>`;
    status.style.color = '#00ff9d';

  } catch (error) {
    console.error(error);
    status.textContent = 'حدث خطأ: ' + error.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});
