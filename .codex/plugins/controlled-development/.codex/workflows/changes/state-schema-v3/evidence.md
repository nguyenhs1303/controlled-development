# Bằng chứng: State schema v3

## Biên nhận red-green

| ID | Trạng thái | Bước kiểm tra | Kết quả liên quan | Chứng minh cho |
|---|---|---|---|---|
| RED-001 | `FAIL` | Focused reference test | `ENOENT` vì `references/workflow-state-schema.md` chưa tồn tại | TASK-001, AC-006 |
| GREEN-001 | `PASS` | `node --test --test-name-pattern="workflow state schema reference" scripts/validate.test.mjs` | 1 focused test pass | TASK-001, AC-006 |
| RED-002 | `FAIL` | Focused schema 3/future-version tests | 5 test fail vì validator chỉ hỗ trợ schema 1/2 | TASK-002, TASK-003, AC-002 đến AC-005, AC-008 |
| GREEN-002 | `PASS` | Focused schema 3/future-version tests sau implementation | 5 focused test pass | TASK-002, TASK-003 |
| RED-003 | `FAIL` | Focused template/primary-fixture test | Expected schema 3, observed schema 2 | TASK-004, AC-001, AC-007 |
| GREEN-003 | `PASS` | Focused template/legacy compatibility tests và structural validator | 3 focused test pass; structural validation pass | TASK-004 |
| RED-004 | `FAIL` | Focused supplemental-fixture test | Expected schema 3, observed schema 2 | TASK-005 |
| GREEN-004 | `PASS` | Focused supplemental-fixture test sau update | Fixture schema 3 hợp lệ | TASK-005 |

Tất cả lệnh trên chạy tại `.codex/plugins/controlled-development`. Baseline Git: HEAD
`a69b02c60ac50f3b0176ef153cc355b621100659`; working tree có thay đổi người dùng đã được giữ nguyên.

## Biên nhận verification

### VERIFY-001

- Trạng thái: `PASS`
- Thời gian/tham chiếu: 2026-09-18
- Bước kiểm tra: `node --test scripts/validate.test.mjs`
- Thư mục làm việc/đối tượng: `.codex/plugins/controlled-development`
- Mã thoát/kết quả: `0`; 53/53 tests pass
- Chứng minh cho: AC-001 đến AC-008
- Kết quả liên quan: schema 1/2 compatibility, schema 3 invariants, approval binding, future-version rejection,
  template và fixture đều pass.

### VERIFY-002

- Trạng thái: `PASS`
- Bước kiểm tra: `node scripts/validate.mjs`
- Mã thoát/kết quả: `0`; `Controlled Development validation passed`
- Chứng minh cho: AC-001, AC-002, AC-004, AC-009

### VERIFY-003

- Trạng thái: `PASS`
- Bước kiểm tra: `node scripts/run-trigger-evals.mjs`
- Mã thoát/kết quả: `0`; 33 positives, 33 rank-1
- Chứng minh cho: AC-009 regression

### VERIFY-004

- Trạng thái: `PASS`
- Bước kiểm tra: `python .../plugin-creator/scripts/validate_plugin.py .`
- Mã thoát/kết quả: `0`; plugin validation passed
- Chứng minh cho: AC-009

### VERIFY-005

- Trạng thái: `PASS`
- Bước kiểm tra: `git diff --check` trên file thuộc phạm vi và scoped diff review
- Mã thoát/kết quả: `0`; chỉ có cảnh báo line-ending, không có whitespace error
- Chứng minh cho: AC-010
- Kết quả liên quan: không thêm CLI, state store, event runtime, skill integration hoặc marketplace update trong
  change này.

## Ma trận acceptance criterion

| Criterion | Bằng chứng triển khai | Biên nhận xác minh | Trạng thái |
|---|---|---|---|
| AC-001 | `templates/state.json` schema 3 với giá trị khởi tạo và binding pending | VERIFY-001, VERIFY-002 | `PASS` |
| AC-002 | `validateSchema3Integrity` và version-gated flow | GREEN-002, VERIFY-001 | `PASS` |
| AC-003 | Table test revision/sequence/hash invalid | GREEN-002, VERIFY-001 | `PASS` |
| AC-004 | `validateApprovalBinding` cho approved metadata | GREEN-002, VERIFY-001 | `PASS` |
| AC-005 | Pending stale metadata và wrong-artifact tests | GREEN-002, VERIFY-001 | `PASS` |
| AC-006 | `references/workflow-state-schema.md` | GREEN-001, VERIFY-001 | `PASS` |
| AC-007 | Schema 1/2 mutation-free tests | GREEN-003, VERIFY-001 | `PASS` |
| AC-008 | Future version fail-closed test | GREEN-002, VERIFY-001 | `PASS` |
| AC-009 | Full local regression checks | VERIFY-001 đến VERIFY-004 | `PASS` |
| AC-010 | Scoped diff review | VERIFY-005 | `PASS` |
