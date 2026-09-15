# Kế hoạch: Đổi artifact root mặc định sang `.codex`

## Trạng thái

`APPROVED`

## Thứ tự triển khai

1. Viết test RED cho default path mới.
2. Cập nhật validator, template, orchestrator skill, README, fixture và eval.
3. Migrate hai workflow active của source plugin sang `.codex/workflows/changes/`.
4. Cập nhật instruction repository đang dùng override tạm thời.
5. Chạy unit test, plugin validator, behavioral eval dry-run và kiểm tra reference.
6. Cachebuster, reinstall từ marketplace `personal`, kiểm tra installed cache/version và mở phiên mới nếu cần.

## Rủi ro và tương thích

- Existing state có approved override vẫn phải validate để không bắt buộc mass migration ở repository khác.
- Không sửa trực tiếp installed cache; cache mới phải được sinh từ source sau reinstall.
- Marketplace source path giữ nguyên nên không chỉnh `marketplace.json` bằng tay.

## Đánh giá hiệu năng

- Không ảnh hưởng runtime sản phẩm; verification chỉ chạy trên plugin source và fixture nhỏ.
