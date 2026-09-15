# Danh sách task: Đồng bộ DISCOVER với quyền ghi đặc tả

## TASK-001: Thêm behavioral contract cho discovery chưa có write consent

- Trạng thái: `TODO`
- Phụ thuộc: None
- Acceptance criteria: AC-005, AC-007
- File được phê duyệt: `evals/cases/project-discovery.json`
- Mô tả: thêm một execution eval dùng fixture hiện có để yêu cầu read-only discovery nhưng từ chối quyền ghi artifact.

### Điều kiện chấp nhận

- [ ] Case xác nhận agent báo cáo discovery trong hội thoại và không tạo/cập nhật spec, state hoặc evidence artifact.
- [ ] Case không thay đổi file fixture.

### Xác minh

- [ ] RED: `NOT APPLICABLE` — behavioral eval chưa được thực thi vì gọi Codex; mâu thuẫn hiện tại đã có bằng chứng đọc trực tiếp.
- [ ] GREEN: `node scripts/run-behavioral-evals.mjs --all --dry-run` tải case mới.
- [ ] Regression: `node scripts/validate.mjs .` và `node --test scripts/validate.test.mjs`.

### Bằng chứng

- Biên nhận: chờ BUILD
- File đã thay đổi: chờ BUILD
- Ghi chú/blocker: không có

## TASK-002: Đồng bộ chỉ dẫn ghi kết quả discovery

- Trạng thái: `TODO`
- Phụ thuộc: TASK-001
- Acceptance criteria: AC-001, AC-002, AC-003, AC-004, AC-006, AC-007
- File được phê duyệt: `skills/project-discovery/SKILL.md`
- Mô tả: thay quy tắc ghi vô điều kiện bằng nhánh có/không có `Specification Write Consent`, đồng thời cập nhật exit criteria, rationalization, red flag và checklist liên quan.

### Điều kiện chấp nhận

- [ ] Read-only discovery trước consent vẫn được phép.
- [ ] Chưa có consent thì không có artifact write và agent hỏi quyền ghi khi cần persist.
- [ ] Có consent thì Standard/Deep ghi discovery evidence như contract hiện hành.

### Xác minh

- [ ] RED: manual inspection chỉ ra câu “For Standard/Deep, update `spec.md`...” đang vô điều kiện.
- [ ] GREEN: manual criterion inspection xác nhận chỉ dẫn mới khớp orchestrator/change-definition.
- [ ] Regression: chạy đầy đủ validation, trigger eval, unit test và behavioral dry-run.

### Bằng chứng

- Biên nhận: chờ BUILD
- File đã thay đổi: chờ BUILD
- Ghi chú/blocker: không có
