# Bảo mật và secret

- Không in, sao chép, log, commit hoặc ghi vào tài liệu credential, token, key, private key, header Authorization
  hay dữ liệu nhạy cảm.
- Xác định các file secret-bearing của repository trước khi đọc cấu hình runtime.
- Không thêm secret plaintext. MCP và integration dùng OAuth, secret store hoặc tên biến môi trường.
- Secret scan chỉ báo tên file, loại phát hiện và trạng thái; không in chuỗi match.
- Không làm yếu validation, authorization, auditability hoặc tính toàn vẹn để đạt test hay tối ưu hiệu năng.
- Khi kiểm tra integration, ưu tiên metadata và handshake an toàn; không hiển thị request chứa credential.
