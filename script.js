// عناصر الصفحة
const wallInput = document.getElementById('wallImage');
const neonInput = document.getElementById('neonImage');
const wallPreview = document.getElementById('wallPreview');
const neonPreview = document.getElementById('neonPreview');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');

// تخزين الصور كـ Base64 لاستخدامها لاحقاً
let wallBase64 = null;
let neonBase64 = null;

// دالة لتحويل الصورة إلى Base64 وعرضها
function handleImageUpload(input, previewElement, type) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;

    // عرض المعاينة
    previewElement.innerHTML = `<img src="${base64}" alt="معاينة">`;

    // حفظ الـ Base64
    if (type === 'wall') {
      wallBase64 = base64;
    } else {
      neonBase64 = base64;
    }

    // تفعيل الزر إذا تم اختيار الصورتين
    checkBothImagesSelected();
  };
  reader.readAsDataURL(file);
}

// التحقق من وجود الصورتين
function checkBothImagesSelected() {
  if (wallBase64 && neonBase64) {
    mergeBtn.disabled = false;
    status.textContent = 'الصورتان جاهزتان، يمكنك الضغط على زر الدمج';
  } else {
    mergeBtn.disabled = true;
    status.textContent = '';
  }
}

// ربط الأحداث
wallInput.addEventListener('change', () => {
  handleImageUpload(wallInput, wallPreview, 'wall');
});

neonInput.addEventListener('change', () => {
  handleImageUpload(neonInput, neonPreview, 'neon');
});
