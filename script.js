const wallInput = document.getElementById('wallImage');
const neonInput = document.getElementById('neonImage');
const wallPreview = document.getElementById('wallPreview');
const neonPreview = document.getElementById('neonPreview');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');

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
    if (wallBase64 && neonBase64) mergeBtn.disabled = false;
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
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallBase64,
        neonBase64,
        wallMimeType,
        neonMimeType
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل التحليل');

    const instructions = data.instructions;

    status.innerHTML = `
      <div style="background:#1a1a22; padding:16px; border-radius:12px; border:1px solid #00ff9d; margin-top:15px; text-align:right;">
        <strong style="color:#00ff9d; font-size:16px;">تعليمات الدمج جاهزة</strong>
        
        <pre id="instructionsText" style="white-space:pre-wrap; color:#ddd; font-size:13px; margin:12px 0; text-align:left; direction:ltr; max-height:260px; overflow:auto; background:#111; padding:12px; border-radius:8px;">${instructions}</pre>
        
        <button id="copyBtn" style="background:#00ff9d; color:#000; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:15px;">
          نسخ التعليمات
        </button>
        
        <p style="color:#aaa; font-size:13px; margin-top:12px;">
          بعد النسخ → افتح تطبيق Gemini → ارفع الصورتين → الصق التعليمات
        </p>
      </div>
    `;

    // زر النسخ
    document.getElementById('copyBtn').addEventListener('click', () => {
      const text = document.getElementById('instructionsText').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'تم النسخ ✓';
        btn.style.background = '#00cc88';
        setTimeout(() => {
          btn.textContent = 'نسخ التعليمات';
          btn.style.background = '#00ff9d';
        }, 2000);
      });
    });

  } catch (err) {
    status.textContent = 'حدث خطأ: ' + err.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});
