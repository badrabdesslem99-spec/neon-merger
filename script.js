const wallInput = document.getElementById('wallImage');
const neonInput = document.getElementById('neonImage');
const wallPreview = document.getElementById('wallPreview');
const neonPreview = document.getElementById('neonPreview');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');

let wallBase64 = null;
let neonBase64 = null;
let wallMimeType = 'image/jpeg';
let neonMimeType = 'image/jpeg';

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

wallInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], wallPreview, (data, mime) => {
    wallBase64 = data;
    wallMimeType = mime;
  });
});

neonInput.addEventListener('change', (e) => {
  handleFileSelect(e.target.files[0], neonPreview, (data, mime) => {
    neonBase64 = data;
    neonMimeType = mime;
  });
});

function checkReadyState() {
  if (wallBase64 && neonBase64) {
    mergeBtn.disabled = false;
  }
}

mergeBtn.addEventListener('click', async () => {
  if (!wallBase64 || !neonBase64) {
    status.textContent = 'يرجى اختيار الصورتين أولاً';
    status.style.color = '#ff6b6b';
    return;
  }

  mergeBtn.disabled = true;
  status.textContent = 'جاري تحليل الصور...';
  status.style.color = '#00ccff';

  try {
    // الخطوة 1: تحليل الصور
    const analyzeRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallBase64,
        neonBase64,
        wallMimeType,
        neonMimeType
      })
    });

    const analyzeData = await analyzeRes.json();

    if (!analyzeRes.ok) {
      throw new Error(analyzeData.error || 'فشل في تحليل الصور');
    }

    const instructions = analyzeData.instructions;

    if (!instructions) {
      throw new Error('لم يتم الحصول على تعليمات');
    }

    status.textContent = 'جاري توليد الصورة النهائية... قد يستغرق بضع ثوانٍ';

    // الخطوة 2: توليد الصورة
    const mergeRes = await fetch('/api/merge', {
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

    const mergeData = await mergeRes.json();

    if (!mergeRes.ok) {
      throw new Error(mergeData.error || 'فشل في توليد الصورة');
    }

    if (!mergeData.image) {
      throw new Error('لم يتم إرجاع صورة من النموذج');
    }

    // عرض النتيجة
    resultImage.src = mergeData.image;
    downloadBtn.href = mergeData.image;
    resultSection.style.display = 'block';

    status.innerHTML = '<strong style="color:#00ff9d">تم الدمج بنجاح!</strong>';

  } catch (error) {
    console.error(error);
    status.textContent = 'حدث خطأ: ' + error.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});
