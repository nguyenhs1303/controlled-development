# Danh sách task: State schema v3

## TASK-001: Ghi contract workflow state schema 3 dùng chung

- Trạng thái: `DONE`
- Phụ thuộc: None
- Acceptance criteria: AC-006
- File được phê duyệt: `references/workflow-state-schema.md`, `scripts/validate.test.mjs`
- Mô tả: tạo nguồn contract cho schema compatibility và `sha256-text-v1`, kèm test marker chống thiếu nội dung
  chuẩn hóa quan trọng.

### Điều kiện chấp nhận

- [ ] Reference mô tả schema 1/2/3 và chính xác BOM, CRLF, lone CR, whitespace, trailing newline, Unicode
  normalization, invalid UTF-8 và output digest.
- [ ] Không chứa implementation CLI hoặc filesystem write.

### Xác minh

- [ ] RED: thêm focused test đọc reference; test fail vì file/marker chưa tồn tại.
- [ ] GREEN: tạo reference để focused test pass.
- [ ] Regression: chạy toàn bộ `node --test scripts/validate.test.mjs`.

### Bằng chứng

- Biên nhận: `RED-001`, `GREEN-001`, `REG-001`
- File đã thay đổi: `references/workflow-state-schema.md`, `scripts/validate.test.mjs`
- Ghi chú/blocker: không có

## TASK-002: Validate revision, event anchor và future schema

- Trạng thái: `DONE`
- Phụ thuộc: TASK-001
- Acceptance criteria: AC-002, AC-003, AC-008
- File được phê duyệt: `scripts/validate.mjs`, `scripts/validate.test.mjs`
- Mô tả: mở supported version lên schema 3 và thêm helper version-gated cho revision/event anchor.

### Điều kiện chấp nhận

- [ ] Schema 3 hợp lệ chấp nhận revision/event anchor đúng contract.
- [ ] Từng giá trị thiếu, âm, không nguyên hoặc sequence/hash không nhất quán bị từ chối.
- [ ] Schema 4 bị từ chối fail closed và validation không mutate input.

### Xác minh

- [ ] RED: thêm table-driven tests cho valid/invalid core schema 3 và future version; quan sát failure dự kiến.
- [ ] GREEN: triển khai helper schema 3 và supported-version guard để focused tests pass.
- [ ] Regression: chạy toàn bộ unit suite.

### Bằng chứng

- Biên nhận: `RED-002`, `GREEN-002`, `REG-002`
- File đã thay đổi: `scripts/validate.mjs`, `scripts/validate.test.mjs`
- Ghi chú/blocker: không có

## TASK-003: Validate approval binding schema 3

- Trạng thái: `DONE`
- Phụ thuộc: TASK-002
- Acceptance criteria: AC-004, AC-005
- File được phê duyệt: `scripts/validate.mjs`, `scripts/validate.test.mjs`
- Mô tả: kiểm tra metadata pending/approved, digest format và mapping gate sang artifact mà không đọc file.

### Điều kiện chấp nhận

- [ ] Approval approved chỉ hợp lệ khi reference và bốn binding field hợp lệ.
- [ ] Approval pending chỉ hợp lệ khi toàn bộ binding field là `null`.
- [ ] `spec`, `solution`, `plan` chỉ gắn lần lượt với `spec.md`, `solution.md`, `plan.md`.

### Xác minh

- [ ] RED: thêm matrix test cho pending stale metadata, wrong artifact, algorithm, digest và timestamp.
- [ ] GREEN: mở rộng approval validator dưới guard schema 3 để matrix pass.
- [ ] Regression: chạy toàn bộ unit suite, đặc biệt schema 1/2 compatibility.

### Bằng chứng

- Biên nhận: `RED-002`, `GREEN-002`, `REG-002`
- File đã thay đổi: `scripts/validate.mjs`, `scripts/validate.test.mjs`
- Ghi chú/blocker: không có

## TASK-004: Chuyển template và fixture chính sang schema 3

- Trạng thái: `DONE`
- Phụ thuộc: TASK-003
- Acceptance criteria: AC-001, AC-007
- File được phê duyệt: `templates/state.json`, `evals/fixtures/workflow-state/valid-state.json`,
  `evals/fixtures/workflow-state/invalid-state.json`, `scripts/validate.test.mjs`
- Mô tả: đặt giá trị khởi tạo schema 3 cho change mới và giữ fixture/test legacy độc lập để chứng minh compatibility.

### Điều kiện chấp nhận

- [ ] Template bắt đầu `revision: 0`, `lastEventSequence: 0`, `lastEventHash: null` và approval pending metadata
  đều `null`.
- [ ] Fixture hợp lệ/không hợp lệ đại diện schema 3 current behavior.
- [ ] State schema 1 và 2 hợp lệ vẫn pass, không cần field schema 3 và không mutation.

### Xác minh

- [ ] RED: thêm assertion template/current fixture schema 3 và legacy deep-equal; quan sát failure dự kiến.
- [ ] GREEN: cập nhật template/fixture và dữ liệu approval binding để tests pass.
- [ ] Regression: `node scripts/validate.mjs` và toàn bộ unit suite.

### Bằng chứng

- Biên nhận: `RED-003`, `GREEN-003`, `REG-003`
- File đã thay đổi: `templates/state.json`, `evals/fixtures/workflow-state/valid-state.json`,
  `evals/fixtures/workflow-state/invalid-state.json`, `scripts/validate.test.mjs`
- Ghi chú/blocker: không có

## TASK-005: Chuyển fixture workflow bổ trợ sang schema 3

- Trạng thái: `DONE`
- Phụ thuộc: TASK-004
- Acceptance criteria: AC-002, AC-004, AC-007
- File được phê duyệt: `evals/fixtures/workflow-state/blocker-limit-state.json`,
  `evals/fixtures/workflow-state/remediation-state.json`,
  `evals/fixtures/workflow-state/remediation-limit-state.json`,
  `evals/fixtures/workflow-state/learning-retrospective-state.json`, `scripts/validate.test.mjs`
- Mô tả: đưa các fixture current-state còn lại lên schema 3 mà không thay semantics blocker/remediation/review.

### Điều kiện chấp nhận

- [ ] Mỗi fixture có core fields và approval binding phù hợp trạng thái của nó.
- [ ] Assertion riêng chứng minh fixture dùng schema 3 và vẫn kiểm tra đúng behavior gốc.
- [ ] Structural validator chấp nhận toàn bộ fixture hợp lệ.

### Xác minh

- [ ] RED: thêm assertion schema 3 cho fixture bổ trợ; quan sát failure vì fixture còn schema 2.
- [ ] GREEN: cập nhật bốn fixture để focused tests và structural validation pass.
- [ ] Regression: chạy toàn bộ unit suite.

### Bằng chứng

- Biên nhận: `RED-004`, `GREEN-004`, `REG-004`
- File đã thay đổi: bốn fixture bổ trợ và `scripts/validate.test.mjs`
- Ghi chú/blocker: không có

## TASK-006: Xác minh tổng thể và kiểm soát phạm vi

- Trạng thái: `DONE`
- Phụ thuộc: TASK-005
- Acceptance criteria: AC-009, AC-010
- File được phê duyệt: `evals/fixtures/workflow-state/README.md`,
  `.codex/workflows/changes/state-schema-v3/evidence.md`
- Mô tả: cập nhật hướng dẫn fixture, chạy toàn bộ check gốc, ghi receipt và review diff theo ngoài phạm vi.

### Điều kiện chấp nhận

- [ ] Unit, structural, trigger eval và plugin validator đều `PASS` bằng command đã thực thi.
- [ ] Diff review xác nhận không có CLI, state store, event runtime, skill integration hoặc marketplace update.
- [ ] Evidence map đủ AC-001 đến AC-010 và ghi rõ mọi check `NOT RUN`/`UNVERIFIED` nếu có.

### Xác minh

- [ ] RED: `NOT APPLICABLE` — task chỉ tổng hợp regression sau khi từng behavioral slice đã có red-green riêng.
- [ ] GREEN: chạy `node --test scripts/validate.test.mjs`, `node scripts/validate.mjs`,
  `node scripts/run-trigger-evals.mjs` và plugin validator.
- [ ] Regression: `git diff --check` và scoped diff review.

### Bằng chứng

- Biên nhận: `VERIFY-001` đến `VERIFY-005`
- File đã thay đổi: `evals/fixtures/workflow-state/README.md`, `evidence.md`
- Ghi chú/blocker: không có
