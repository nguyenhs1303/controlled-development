# Quy tắc review

- Findings là nội dung chính, xếp theo mức độ nghiêm trọng và có file/dòng, trigger, tác động, bằng chứng và hướng sửa.
- Kiểm tra correctness, regression, secret leak, injection, authorization, transaction, idempotency, input/output
  không giới hạn và compatibility.
- Kiểm tra performance issue khi có bằng chứng cụ thể: N+1, query trong vòng lặp, page sâu, sort không ổn định,
  full scan ngoài chủ đích, payload lớn hoặc tài nguyên không giới hạn.
- Đối chiếu implementation với spec/plan đã duyệt và tìm behavior thiếu, sai hoặc ngoài phạm vi.
- Không biến style-only nit thành finding chặn.
- Với controlled change, review spec compliance trước engineering quality.
- Nếu không có finding, nói rõ và nêu residual risk hoặc testing gap.
