'use strict';

const form = document.getElementById('portal-form');
const requestType = document.getElementById('request-type');
const requestId = document.getElementById('request-id');
const submitButton = document.getElementById('submit-button');
const statusBox = document.getElementById('status');
const panels = Array.from(document.querySelectorAll('.panel'));
const typeButtons = Array.from(document.querySelectorAll('.type-button'));
const dayStatus = document.getElementById('day-status');
const dailyChange = document.getElementById('daily-change');
let timeoutId = null;

// Backend URL được GitHub Actions tạo từ repository secret, không nằm trong source Git.
const backendUrl = String(window.BDS_PORTAL_BACKEND_URL || '').trim();
if (backendUrl) {
  form.action = backendUrl;
} else {
  submitButton.disabled = true;
  hienTrangThai('Cổng chưa được nối với backend. Đức cần cấu hình repository secret.', 'error');
}

const savedMemberId = localStorage.getItem('bds_portal_member_id');
if (savedMemberId) document.getElementById('member-id').value = savedMemberId;

// Mỗi lượt có một khóa ổn định để retry không tạo hàng trùng.
function taoRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID().replace(/-/g, '_');
  }
  return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
}
requestId.value = taoRequestId();

// Panel ẩn bị disable để trình duyệt không gửi nhầm các trường trùng tên.
function chonLoai(type) {
  requestType.value = type;
  typeButtons.forEach(button => button.classList.toggle('active', button.dataset.type === type));
  panels.forEach(panel => {
    const active = panel.dataset.panel === type;
    panel.classList.toggle('active', active);
    panel.querySelectorAll('input, select, textarea').forEach(field => {
      field.disabled = !active;
      field.required = active && field.dataset.required === 'true';
    });
  });
  hienTrangThai('', '');
}

function hienTrangThai(message, type) {
  statusBox.textContent = message;
  statusBox.className = 'status' + (message ? ' show ' + type : '');
}

function ketThucGui() {
  submitButton.disabled = false;
  submitButton.textContent = 'Gửi vào hàng chờ chung';
  if (timeoutId) window.clearTimeout(timeoutId);
  timeoutId = null;
}

typeButtons.forEach(button => button.addEventListener('click', () => chonLoai(button.dataset.type)));
dayStatus.addEventListener('change', () => {
  dailyChange.classList.toggle('hidden', dayStatus.value !== 'Có phát sinh');
});
chonLoai('Chốt ngày');

form.addEventListener('submit', event => {
  if (!form.reportValidity()) {
    event.preventDefault();
    return;
  }
  if (!backendUrl) {
    event.preventDefault();
    return;
  }
  localStorage.setItem('bds_portal_member_id', document.getElementById('member-id').value.trim());
  submitButton.disabled = true;
  submitButton.textContent = 'Đang gửi...';
  hienTrangThai('Đang kiểm tra và ghi vào Sheet trung tâm...', 'loading');
  timeoutId = window.setTimeout(() => {
    ketThucGui();
    hienTrangThai('Chưa nhận được phản hồi. Hãy kiểm tra mạng rồi bấm gửi lại; mã lượt gửi vẫn giữ nguyên để không tạo bản trùng.', 'error');
  }, 30000);
});

// Apps Script chạy nội dung trong một iframe googleusercontent lồng bên trong iframe đích.
// Vì vậy kiểm origin Google sandbox và bắt buộc requestId khớp thay cho so sánh window trực tiếp.
function laNguonAppsScript(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' &&
      (url.hostname === 'script.googleusercontent.com' ||
        url.hostname.endsWith('-script.googleusercontent.com'));
  } catch (error) {
    return false;
  }
}

window.addEventListener('message', event => {
  if (!laNguonAppsScript(event.origin)) return;
  const data = event.data || {};
  if (!data.requestId || data.requestId !== requestId.value) return;
  ketThucGui();
  if (!data.ok) {
    hienTrangThai(data.message || 'Không gửi được cập nhật.', 'error');
    return;
  }
  const confirmation = data.queueId || data.logId || data.requestId;
  hienTrangThai((data.message || 'Đã tiếp nhận.') + (confirmation ? ' Mã xác nhận: ' + confirmation : ''), 'success');
  requestId.value = taoRequestId();
});
