# Hiệu năng và khả năng mở rộng

<!-- REPOSITORY-BOOTSTRAP-PENDING -->

Trước thay đổi có ảnh hưởng runtime, đánh giá:

- Quy mô dữ liệu, lưu lượng, độ đồng thời và phân bố tải.
- Luồng đọc/ghi, query/index, external service và số round-trip.
- Pagination, batch, streaming, memory và response size.
- Transaction, lock, connection/thread pool, timeout, retry và backpressure.
- Bottleneck dự kiến, giải pháp, phương án khác và trade-off.
- Cách xác minh bằng execution plan, query count, benchmark hoặc metric phù hợp.

Không tăng pool/thread/timeout, thêm cache hoặc index khi chưa xác định bottleneck. Không đánh đổi correctness,
security, auditability hoặc data integrity để lấy hiệu năng.

Nếu thay đổi không ảnh hưởng hiệu năng, spec/plan vẫn phải ghi căn cứ. Nếu chưa benchmark được, nêu rõ giả định,
residual risk và môi trường/dữ liệu/lệnh/metric cần dùng để kiểm chứng.
