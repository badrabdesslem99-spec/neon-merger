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

// حدث الضغط على زر الدمج عبر Vercel API
mergeBtn.addEventListener('click', async () => {
  if (!wallBase64 || !neonBase64) {
    status.textContent = 'يرجى اختيار الصورتين أولاً';
    status.style.color = '#ff6b6b';
    return;
  }

  // تعطيل الزر أثناء العمل
  mergeBtn.disabled = true;
  status.textContent = 'جاري تحليل الصور بواسطة Gemini (عبر Vercel)... يرجى الانتظار';
  status.style.color = '#00ccff';

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallBase64: wallBase64,
        neonBase64: neonBase64,
        wallMimeType: wallMimeType,
        neonMimeType: neonMimeType
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ من السيرفر');
    }

    const instructions = data.instructions;

    if (!instructions) {
      throw new Error('لم يتم الحصول على تعليمات من النموذج');
    }

    // عرض التعليمات
    status.innerHTML = `
      <div style="text-align: right; background:#1a1a22; padding:15px; border-radius:10px; margin-top:15px; border:1px solid #00ff9d;">
        <strong style="color:#00ff9d;">تعليمات الدمج التي كتبها Gemini 3.5:</strong>
        <pre style="white-space: pre-wrap; color:#ddd; margin-top:10px; font-size:13px; text-align:left; direction:ltr;">${instructions}</pre>
      </div>
    `;
    status.style.color = '#00ff9d';

    // حفظ التعليمات للمرحلة القادمة
    window.mergeInstructions = instructions;

  } catch (error) {
    console.error(error);
    status.textContent = 'حدث خطأ: ' + error.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});
  
