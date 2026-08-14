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
  status.textContent = 'جاري تحليل الصور بواسطة Gemini 3.5...';
  status.style.color = '#00ccff';

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallBase64,
        neonBase64,
        wallMimeType,
        neonMimeType
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'فشل في التحليل');
    }

    const instructions = data.instructions;

    // عرض التعليمات + زر نسخ
    status.innerHTML = `
      <div style="background:#1a1a22; padding:15px; border-radius:12px; border:1px solid #00ff9d; margin-top:15px; text-align:right;">
        <strong style="color:#00ff9d; font-size:16px;">تعليمات الدمج جاهزة:</strong>
        <pre id="instructionsText" style="white-space:pre-wrap; color:#ddd; margin:12px 0; font-size:13px; text-align:left; direction:ltr; max-height:300px; overflow:auto; background:#111; padding:10px; border-radius:8px;">${instructions}</pre>
        <button onclick="copyInstructions()" style="background:#00ff9d; color:#000; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">
          نسخ التعليمات
        </button>
        <p style="color:#aaa; font-size:13px; margin-top:12px;">
          بعد النسخ → افتح Google AI Studio أو تطبيق Gemini → ارفع الصورتين → الصق التعليمات
        </p>
      </div>
    `;

  } catch (error) {
    status.textContent = 'حدث خطأ: ' + error.message;
    status.style.color = '#ff6b6b';
  } finally {
    mergeBtn.disabled = false;
  }
});

function copyInstructions() {
  const text = document.getElementById('instructionsText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert('تم نسخ التعليمات بنجاح!');
  });
}
