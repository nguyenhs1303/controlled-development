# Kế hoạch triển khai: {{tiêu đề thay đổi}}

## Metadata

- Change ID: `{{change-id}}`
- Tham chiếu phê duyệt đặc tả: {{spec approval}}
- Tham chiếu phê duyệt giải pháp: {{solution approval}}
- Mức rủi ro: `{{low|medium|high}}`
- Bắt buộc phê duyệt kế hoạch: `{{yes|no}}`

## Cách tiếp cận

{{Chiến lược triển khai ngắn gọn}}

## Truy vết giải pháp đã duyệt

| Task/Quyết định | Solution section | Acceptance criterion | Bằng chứng/nguồn |
|---|---|---|---|
| {{task hoặc quyết định cơ học}} | {{mục trong solution.md}} | {{AC-ID}} | {{path, contract hoặc tham chiếu phiên}} |

Plan không được chọn lại kiến trúc. `INTERNAL CHOICE` chỉ dùng cho chi tiết cơ học, cục bộ, có thể hoàn tác
và không ảnh hưởng behavior, scope, data/API, compatibility, architecture ownership, security, risk,
permission hoặc verification. Quyết định material mới phải quay lại `SOLUTION DESIGN`.

## Sơ đồ phụ thuộc

```text
{{foundation -> vertical slice -> verification}}
```

## Danh sách task

| Task | Acceptance criteria | Phụ thuộc | File dự kiến | Xác minh |
|---|---|---|---|---|
| TASK-001 | AC-001 | None | {{path}} | {{lệnh gốc của dự án}} |

## Checkpoint

- {{Checkpoint sau một nhóm phụ thuộc nhỏ}}

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| {{rủi ro}} | {{tác động}} | {{biện pháp giảm thiểu}} |

## Rollback/Phục hồi

{{Cách cô lập hoặc hoàn tác thay đổi cục bộ mà không thực hiện hành động shipping}}

## Phê duyệt kế hoạch

- Quyết định: `PENDING`
- Người phê duyệt: {{con người}}
- Tham chiếu/thời gian: {{tham chiếu phiên làm việc}}
- Ghi chú: {{ghi chú}}
