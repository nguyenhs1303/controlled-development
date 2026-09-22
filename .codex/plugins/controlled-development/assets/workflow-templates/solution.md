# Thiết kế giải pháp: {{tiêu đề thay đổi}}

## Metadata

- Change ID: `{{change-id}}`
- Chế độ: `{{SOLUTION LITE|FULL SOLUTION}}`
- Tham chiếu đặc tả đã duyệt: {{spec approval}}
- Phiên bản giải pháp: `{{version}}`

## Bối cảnh quyết định

{{Vấn đề kỹ thuật cần quyết định và phạm vi của quyết định}}

## Bằng chứng và ràng buộc

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| {{dữ kiện hoặc ràng buộc}} | `EVIDENCED` / `USER CONFIRMED` | {{path, contract hoặc tham chiếu phiên}} |

## Decision drivers

| Driver | Mức bắt buộc | Bằng chứng/nguồn |
|---|---|---|
| {{tiêu chí dùng để lựa chọn}} | `MUST` / `SHOULD` | {{criterion, path hoặc xác nhận người dùng}} |

## Quality scenarios

| Thuộc tính | Scenario đo được | Trạng thái bằng chứng |
|---|---|---|
| {{performance/security/reliability/...}} | {{stimulus, điều kiện, response và measure}} | `MEASURED` / `EVIDENCED` / `HYPOTHESIS` / `UNKNOWN` |

Nếu quality scenario không liên quan, ghi rõ căn cứ. Không tự đặt SLO, workload, data volume hoặc concurrency.

## Các giải pháp được xem xét

### Option 1: {{tên giải pháp}}

- Lý do được xem xét: {{lý do}}
- Kiến trúc cấp cao: {{mô tả}}
- Pattern/công nghệ: {{pattern, technology hoặc không có}}
- Ưu điểm: {{nội dung}}
- Nhược điểm: {{nội dung}}
- Performance và quality impact: {{nội dung cùng mức confidence}}
- Rủi ro/migration/rollback: {{nội dung}}
- Bằng chứng và điểm chưa chắc chắn: {{MEASURED|EVIDENCED|INFERRED|HYPOTHESIS|UNKNOWN}}

Không tạo option giả để đủ số lượng. Với `SOLUTION LITE`, một option có bằng chứng và phần giải thích vì sao
không cần lựa chọn kiến trúc khác là hợp lệ. Wrapper, abstraction song song, dependency hoặc indirection chỉ
khác về cách triển khai nhưng không giải quyết thêm decision driver thì không phải là option hợp lệ.

## So sánh trade-off

| Tiêu chí | Option 1 | Option 2 | Căn cứ |
|---|---|---|---|
| {{driver}} | `PASS/FAIL/HIGH/MEDIUM/LOW/UNKNOWN` | {{giá trị}} | {{bằng chứng hoặc phép đo cần chạy}} |

Không dùng điểm số hoặc trọng số tự đặt.

## Giải pháp khuyến nghị

- Option: {{tên}}
- Lý do: {{vì sao phù hợp nhất với decision drivers}}
- Phần còn là giả thuyết: {{nội dung hoặc không có}}
- Phần cần người dùng quyết định: {{nội dung hoặc không có}}

## Kiến trúc được đề xuất

- Boundary/component: {{mô tả}}
- Data/runtime flow: {{mô tả}}
- Architectural/design pattern: {{pattern, vấn đề được giải quyết và vị trí áp dụng hoặc không cần pattern mới}}
- C4/dynamic/deployment view: {{sơ đồ nếu thực sự hữu ích hoặc không áp dụng}}

## Công nghệ và dependency

| Thay đổi | Loại | Lý do | Permission |
|---|---|---|---|
| {{technology/dependency/config hoặc không có}} | {{new/change/remove}} | {{lý do}} | `REQUIRED/NOT REQUIRED` |

## Verification conditions

| Claim/driver | Cách xác minh | Kết quả cần quan sát |
|---|---|---|
| {{claim}} | {{test/benchmark/profile/review}} | {{điều kiện pass}} |

## Consequences và technical debt

- Tích cực: {{nội dung}}
- Tiêu cực: {{nội dung}}
- Technical debt chấp nhận: {{nội dung hoặc không có}}

## Revisit conditions

- {{Điều kiện cụ thể khiến quyết định phải được đánh giá lại}}

## Câu hỏi còn mở

- {{Không có hoặc câu hỏi material phải được giải quyết trước khi duyệt}}

## Phê duyệt giải pháp

- Quyết định: `PENDING`
- Người phê duyệt: {{con người}}
- Tham chiếu/thời gian: {{tham chiếu phiên làm việc}}
- Ghi chú: {{ghi chú}}
