# Danh sách task: Chuẩn hóa cấu trúc portable plugin

## TASK-001: Thêm portable root manifest
- Trạng thái: `DONE`
- Phụ thuộc: None
- Acceptance criteria: AC-001
- File đã thay đổi: `plugin.json`
- Kết quả: Root manifest dùng Agent Plugins schema và chứa `extensions.com.openai`.

## TASK-002: Giữ và kiểm tra compatibility overlay
- Trạng thái: `DONE`
- Phụ thuộc: TASK-001
- Acceptance criteria: AC-002
- File đã thay đổi: `.codex-plugin/plugin.json`, `scripts/validators/validate-plugin.mjs`
- Kết quả: Overlay được giữ, cachebuster cập nhật và drift identity/interface bị validator từ chối.

## TASK-003: Mở rộng package validator cho hai manifest
- Trạng thái: `DONE`
- Phụ thuộc: TASK-002
- Acceptance criteria: AC-001, AC-002, AC-008
- File đã thay đổi: `scripts/validators/validate-plugin.mjs`, `tests/unit/validate-plugin.test.mjs`
- Kết quả: Validator kiểm tra portable schema marker, compatibility contract và semantic consistency.

## TASK-004: Tách runtime, test, fixture và eval runner
- Trạng thái: `DONE`
- Phụ thuộc: TASK-003
- Acceptance criteria: AC-003
- File đã thay đổi: `scripts/runtime/`, `scripts/validators/`, `tests/`, `evals/runners/`
- Kết quả: Runtime, validators, unit tests, fixtures và eval runners có boundary riêng.

## TASK-005: Chuyển workflow templates sang assets
- Trạng thái: `DONE`
- Phụ thuộc: TASK-004
- Acceptance criteria: AC-004
- File đã thay đổi: `assets/workflow-templates/`, skills, validator, tests
- Kết quả: Mọi template consumer và link dùng path mới.

## TASK-006: Tách workflow-state validator khỏi package validator
- Trạng thái: `DONE`
- Phụ thuộc: TASK-005
- Acceptance criteria: AC-006
- File đã thay đổi: `scripts/runtime/validate-workflow-state.mjs`, `scripts/validators/validate-plugin.mjs`, controller/tests
- Kết quả: Controller chỉ phụ thuộc state validator trong runtime boundary.

## TASK-007: Phân nhóm reference và cập nhật toàn bộ path
- Trạng thái: `DONE`
- Phụ thuộc: TASK-006
- Acceptance criteria: AC-005, AC-007
- File đã thay đổi: `references/policies/`, `references/schemas/`, skills, README, evals, tests
- Kết quả: Link validator và source search không phát hiện stale plugin path.

## TASK-008: Xác minh đầy đủ
- Trạng thái: `DONE`
- Phụ thuộc: TASK-007
- Acceptance criteria: AC-008
- File đã thay đổi: không áp dụng
- Kết quả: package validator, 69 unit/controller tests, trigger eval, behavioral dry-run, syntax checks, diff check và portable JSON schema validation PASS; Python skill validators `NOT RUN` do thiếu `PyYAML`.
