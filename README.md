# Cổng cập nhật tri thức BĐS

Repo công khai này chỉ chứa giao diện GitHub Pages. Nó không chứa kho tri thức BĐS, Google Sheet, URL backend thật, mã truy cập thành viên hoặc dữ liệu đã gửi.

- Giao diện: `site/`.
- Backend: Google Apps Script của tài khoản trung tâm.
- Kết nối backend: GitHub Actions secret `BDS_PORTAL_BACKEND_URL`.
- Dữ liệu: gửi trực tiếp từ trình duyệt tới Apps Script bằng POST trong iframe ẩn; không đi qua GitHub.

Không commit `site/config.js`; workflow tạo file này khi deploy.
