# Kiến trúc repository

Hiệu chỉnh file này theo code thực tế của repository:

- Module và dependency direction.
- Entry point và execution path chính.
- Boundary giữa UI, API, domain, persistence và integration.
- Nơi đặt source, test, resource và migration.
- Pattern validation, error handling, transaction và response contract.
- External service, queue, database, cache và ownership dữ liệu.

Codex phải bắt đầu từ entry point liên quan và dùng `rg` xác nhận call site trước khi kết luận code không dùng.
