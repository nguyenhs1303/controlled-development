# Tổng quan repository

<!-- REPOSITORY-BOOTSTRAP-PENDING -->

File này phải được hiệu chỉnh sau khi cài starter kit vào repository mới.

## Nội dung cần mô tả

- Mục đích sản phẩm và domain.
- Loại repository: backend, frontend, full-stack, library, infrastructure hoặc dạng khác.
- Ngôn ngữ, framework, build system và package manager.
- Entry point, module chính và execution path quan trọng.
- Lệnh build, test, lint, type-check và chạy local.
- Nguồn chân lý cho API/schema/config.
- File chứa secret hoặc dữ liệu nhạy cảm không được hiển thị.

## Bản đồ instruction

- Mọi thay đổi có khả năng ảnh hưởng tải hoặc tài nguyên: `performance.md`.
- Khi cần hiểu module và execution path: `architecture.md`.
- Khi viết hoặc review code: `code-conventions.md`.
- Khi build/test hoặc chạy service: `local-development.md`.
- Khi repository cần quy tắc chuyên biệt, thêm file dưới thư mục này và cập nhật bản đồ tại đây.

Không suy diễn behavior runtime từ tên file hoặc cấu hình; xác nhận bằng bean, call path, build file hoặc test thực tế.
