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

// وظيفة قراءة الصورة وتحويلها إلى Base64
function handleFileSelect(file, previewElement, callback) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    previewElement.innerHTML = `<img src="${e.target.result}" alt="معاينة">`;
    callback(e.target.result);
    checkReadyState();
  };
  reader.readAsDataURL(file);
}

// التنسيق عند اختيار ملف الحائط
wallInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], wallPreview, (data) => {
    wallBase64 = data;
  });
});

// التنسيق عند اختيار ملف النيون
neonInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], neonPreview, (data) => {
    neonBase64 = data;
  });
});

// التحقق من رفع الصورتين لتفعيل الزر
function checkReadyState() {
  if (wallBase64 && neonBase64) {
    mergeBtn.disabled = false;
  }
}

// حدث الضغط على زر الدمج
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

  // تعطيل الزر أثناء المعالجة
  mergeBtn.disabled = true;
  status.textContent = 'جاري التحضير... (المرحلة القادمة: استدعاء Gemini)';
  status.style.color = '#00ccff';

  // تجربة اختبارية للزر
  setTimeout(() => {
    status.textContent = 'الزر يعمل بنجاح! جاهزون للمرحلة 3 الحقيقية (استدعاء Gemini 3.5)';
    status.style.color = '#00ff9d';
    mergeBtn.disabled = false;
  }, 1500);
});

