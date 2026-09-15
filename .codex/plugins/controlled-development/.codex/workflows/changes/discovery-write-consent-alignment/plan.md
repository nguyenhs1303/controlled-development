# Kế hoạch triển khai: Đồng bộ DISCOVER với quyền ghi đặc tả

## Metadata

- Change ID: `discovery-write-consent-alignment`
- Tham chiếu phê duyệt đặc tả: xác nhận “duyệt” trong phiên hiện tại, `2026-09-15T14:34:45+07:00`
- Mức rủi ro: `medium`
- Bắt buộc phê duyệt kế hoạch: `yes`

## Cách tiếp cận

Thực hiện một thay đổi dọc nhỏ: trước tiên bổ sung behavioral eval mô tả tình huống chưa có write consent, sau đó sửa duy nhất skill `project-discovery` để hành vi được mong đợi trở thành chỉ dẫn rõ ràng. Không thay đổi orchestrator, schema, validator hoặc policy khi chưa có bằng chứng bắt buộc.

## Quyết định kiến trúc

| Quyết định | Lý do | Bằng chứng/nguồn |
|---|---|---|
| Giữ `Specification Write Consent` là khái niệm điều phối hiện có | Tránh tạo state/schema mới ngoài phạm vi | `skills/controlled-development/SKILL.md`, `skills/change-definition/SKILL.md` |
| Sửa tại phase skill đang mâu thuẫn | Orchestrator và `change-definition` đã thống nhất; `project-discovery` là phần còn lệch | `skills/project-discovery/SKILL.md` mục “Record the discovery result” |
| Dùng execution behavioral eval với fixture | Cho phép phát hiện cả việc tạo/sửa artifact ngoài mong đợi khi eval được chạy thật | `scripts/run-behavioral-evals.mjs` snapshot workspace trước/sau |

## Sơ đồ phụ thuộc

```text
TASK-001 behavioral contract -> TASK-002 skill alignment -> full verification and ordered reviews
```

## Danh sách task

| Task | Acceptance criteria | Phụ thuộc | File dự kiến | Xác minh |
|---|---|---|---|---|
| TASK-001 | AC-005, AC-007 | None | `evals/cases/project-discovery.json` | Behavioral dry-run nhận case mới; changed-file scope chỉ gồm eval và artifact |
| TASK-002 | AC-001..AC-004, AC-006, AC-007 | TASK-001 | `skills/project-discovery/SKILL.md` | Manual criterion inspection; validation, trigger eval, unit test, behavioral dry-run |

## Checkpoint

- Sau TASK-001: case mới phải hợp lệ và chưa có skill implementation nào bị sửa.
- Sau TASK-002: toàn bộ bốn lệnh kiểm tra cục bộ phải chạy; behavioral execution thật là `NOT RUN` vì gọi Codex và không thuộc phạm vi kiểm tra miễn phí đã duyệt.
- Sau VERIFY: chạy `spec-compliance-review` trước `engineering-review`.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| Chỉ dẫn mới vô tình cấm cả read-only discovery | Workflow không thể thu thập dữ kiện trước consent | Nêu rõ read-only discovery và báo cáo hội thoại luôn được phép |
| Resume flow bị cản không cần thiết | Change đã có artifact hợp lệ phải xin lại quyền cho mọi cập nhật kỹ thuật | Giới hạn gate vào việc tạo/cập nhật artifact đặc tả và nội dung khẳng định đã persist; không đổi schema/resume model |
| Eval chỉ được dry-run | Chưa chứng minh hành vi mô hình thực tế | Ghi rõ giới hạn; case execution sẵn sàng để chạy riêng khi được phép |

## Rollback/Phục hồi

Vì source không phải Git repository, rollback dựa trên bản installed cache có hash trùng baseline cho hai file dự kiến sửa. Không sửa cache trực tiếp; nếu validation thất bại, khôi phục đúng hai file source từ baseline đã đọc và ghi blocker evidence.

## Phê duyệt kế hoạch

- Quyết định: `PENDING`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: chờ xác nhận cho kế hoạch phiên bản 1
- Ghi chú: không cho phép mở rộng sang đóng gói `.codex/workflows`, cleanup artifact, state schema hoặc dependency.
