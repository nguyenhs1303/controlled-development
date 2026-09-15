# Quy tắc build, test và xác minh

- Khám phá lệnh build/test native từ manifest, build file, CI và tài liệu repository trước khi chạy.
- Chỉ tuyên bố `PASS` khi check đã chạy thành công sau thay đổi liên quan.
- Ghi rõ lệnh, working directory, exit code, kết quả và phần chưa xác minh.
- Test mới bám theo test gần nhất cùng tầng và convention thực tế của repository.
- Không làm yếu assertion, bỏ qua test hoặc hạ safeguard để đạt kết quả xanh.
- Unit test hoặc dữ liệu nhỏ không tự chứng minh hiệu năng production.
- Sau thay đổi runtime, áp dụng đúng yêu cầu smoke test trong `AGENTS.md` của repository.
