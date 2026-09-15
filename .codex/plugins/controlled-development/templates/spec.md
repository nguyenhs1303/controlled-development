# Đặc tả thay đổi: {{tiêu đề thay đổi}}

## Metadata

- Change ID: `{{change-id}}`
- Workflow profile: `{{quick|standard|deep}}`
- Mức rủi ro: `{{low|medium|high}}`
- Trạng thái: `DRAFT`

## Mục tiêu

{{Nội dung được xây dựng, đối tượng hưởng lợi và lý do}}

## Phạm vi

- {{Hành vi hoặc sản phẩm bàn giao đã được phê duyệt}}

## Ngoài phạm vi

- {{Hành vi bị loại trừ rõ ràng}}

## Acceptance criteria

- [ ] AC-001: {{Kết quả cụ thể, có thể quan sát và kiểm thử}}

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: {{path}}
- Lệnh gốc và nguồn xác định: {{command}}
- Module/pattern liên quan: {{path và quan sát}}

## Căn cứ yêu cầu và quyết định

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| {{yêu cầu/quyết định có ảnh hưởng đáng kể}} | `EVIDENCED FACT` hoặc `USER-CONFIRMED DECISION` | {{path, test, contract hoặc tham chiếu phiên}} |

Không đưa `PROPOSAL` hoặc `UNKNOWN` vào phạm vi/criterion như một quyết định đã chốt.

## Giả định triển khai không trọng yếu

1. {{Chi tiết cơ học, cục bộ, có thể hoàn tác và không ảnh hưởng behavior/scope/data/API/architecture/security/risk/verification}}

## Phân loại rủi ro

- Yếu tố cao nhất: {{factor}}
- Lý do: {{evidence}}
- Điều kiện nâng mức: {{condition}}

## Ranh giới quyền hạn

- Được phép: {{thao tác cục bộ}}
- Phải hỏi trước: {{thao tác nhạy cảm}}
- Tuyệt đối không: commit, push, PR, merge, deploy, production access, real-data mutation

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001 | {{lệnh gốc/bước kiểm tra thủ công}} | {{receipt}} |

## Câu hỏi còn mở

- {{Không có hoặc câu hỏi cần con người quyết định}}

Nếu còn câu hỏi có ảnh hưởng đáng kể, đặc tả chưa sẵn sàng để xin phê duyệt.

## Phê duyệt

- Quyết định: `PENDING`
- Người phê duyệt: {{con người}}
- Tham chiếu/thời gian: {{tham chiếu phiên làm việc}}
- Ghi chú phạm vi được duyệt: {{ghi chú}}
