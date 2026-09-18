# Đặc tả thay đổi: State schema v3

## Metadata

- Change ID: `state-schema-v3`
- Spec version: `1`
- Workflow profile: `deep`
- Mức rủi ro: `high`
- Trạng thái: `APPROVED`

## Mục tiêu

Định nghĩa và kiểm chứng contract `schemaVersion: 3` cho workflow state của Controlled Development để các bước
controller tiếp theo có thể dùng optimistic revision, approval gắn với đúng nội dung artifact và một anchor có
thể đối chiếu với event ledger, đồng thời bảo toàn khả năng xác thực state schema 1/2 hiện có.

## Phạm vi

- Định nghĩa các field và invariant mới của schema 3.
- Chuyển template dành cho change mới sang schema 3.
- Mở rộng validator để nhận schema 3 và fail closed khi field hoặc invariant mới không hợp lệ.
- Gắn mỗi approval schema 3 với artifact tương ứng bằng đường dẫn, thuật toán digest, digest, thời điểm duyệt và
  tham chiếu duyệt.
- Định nghĩa thuật toán `sha256-text-v1` cho artifact Markdown.
- Giữ validator tương thích với schema 1/2 theo semantics hiện tại và không tự động sửa hoặc migrate state cũ.
- Thêm fixture và deterministic test cho contract schema 3, compatibility schema 1/2 và future schema rejection.
- Cập nhật tài liệu contract state cần thiết để các đầu việc controller sau sử dụng cùng một nguồn quy tắc.

## Ngoài phạm vi

- Tách transition rules khỏi `scripts/validate.mjs`.
- Thêm CLI `status`, `validate-state`, `check-resume`, `hash-artifact`, `approve` hoặc `transition`.
- Thêm lock file, optimistic write, atomic replace hoặc state store runtime.
- Tạo event file, hash chain hoặc crash recovery runtime.
- Sửa skill để gọi controller.
- Sync, cachebuster hoặc reinstall plugin trong personal marketplace.
- Tự động migrate file schema 1/2 sang schema 3.

## Contract schema 3

### Workflow revision và event anchor

- `revision` là số nguyên không âm; state mới bắt đầu tại `0`.
- `lastEventSequence` là số nguyên không âm; state mới bắt đầu tại `0`.
- `lastEventHash` là `null` khi `lastEventSequence` bằng `0`.
- Khi `lastEventSequence` lớn hơn `0`, `lastEventHash` phải có dạng `sha256:` theo sau bởi đúng 64 ký tự hex
  viết thường.
- Schema 3 không được thiếu bất kỳ field nào trong ba field trên.

### Approval binding

Mỗi record `approvals.spec`, `approvals.solution` và `approvals.plan` của schema 3 phải có thêm:

- `artifactPath`: `null` khi pending; khi approved phải là đúng một trong `spec.md`, `solution.md` hoặc `plan.md`
  tương ứng với gate.
- `digestAlgorithm`: `null` khi pending; khi approved phải là `sha256-text-v1`.
- `artifactDigest`: `null` khi pending; khi approved phải có dạng `sha256:` theo sau bởi đúng 64 ký tự hex viết
  thường.
- `approvedAt`: `null` khi pending; khi approved phải là ISO timestamp hợp lệ.

Approval schema 3 có `status: approved` chỉ hợp lệ khi `reference` và toàn bộ binding metadata tương ứng đều
hợp lệ. Approval pending không được giữ metadata của một approval cũ; các binding field phải là `null`.

### Thuật toán `sha256-text-v1`

Contract hashing cho artifact Markdown được định nghĩa như sau:

1. Đọc file dưới dạng UTF-8 hợp lệ; input UTF-8 không hợp lệ phải bị từ chối.
2. Loại bỏ tối đa một UTF-8 BOM ở đầu nội dung.
3. Chuẩn hóa mọi chuỗi CRLF (`\r\n`) thành LF (`\n`); ký tự CR đơn lẻ vẫn là nội dung và không bị đổi.
4. Không trim whitespace, không đổi trailing newline và không Unicode-normalize.
5. Hash UTF-8 bytes của nội dung đã chuẩn hóa bằng SHA-256.
6. Biểu diễn kết quả dưới dạng `sha256:<64-lowercase-hex>`.

Đầu việc này chỉ định nghĩa contract và validation shape. Việc đọc file và tính digest được triển khai trong
đầu việc CLI `hash-artifact`.

### Compatibility và migration

- Schema 1 tiếp tục được validate bằng legacy phase/approval rules hiện có.
- Schema 2 tiếp tục được validate bằng phase/triage/solution rules hiện có.
- Validator không yêu cầu field schema 3 trên state schema 1/2.
- State có schema version lớn hơn version được hỗ trợ phải fail closed.
- Validation không được mutate hoặc tự động migrate state schema 1/2.
- Change mới dùng template schema 3 sau khi đầu việc này hoàn tất.
- Migration runtime và quyền ghi state legacy sẽ được quyết định trong đầu việc controller/state-store; đầu việc
  hiện tại không tuyên bố schema 1/2 có các guarantee về revision, artifact digest hoặc event integrity.

## Acceptance criteria

- [ ] AC-001: `templates/state.json` dùng `schemaVersion: 3`, khởi tạo `revision: 0`,
  `lastEventSequence: 0`, `lastEventHash: null` và approval binding field ở trạng thái pending hợp lệ.
- [ ] AC-002: `validateWorkflowState` chấp nhận state schema 3 hợp lệ và yêu cầu đầy đủ revision/event anchor.
- [ ] AC-003: Validator từ chối revision âm/không nguyên, event sequence không hợp lệ, event hash sai format hoặc
  quan hệ sequence/hash không nhất quán.
- [ ] AC-004: Validator chỉ chấp nhận approval schema 3 ở trạng thái approved khi reference, artifact path,
  `sha256-text-v1`, digest và `approvedAt` đều hợp lệ.
- [ ] AC-005: Validator từ chối approval pending còn lưu binding metadata và từ chối approval gắn nhầm loại
  artifact với gate.
- [ ] AC-006: Contract `sha256-text-v1` được ghi ở một reference dùng chung và mô tả chính xác BOM, CRLF,
  whitespace, trailing newline, Unicode normalization, invalid UTF-8 và output format.
- [ ] AC-007: Fixture/test chứng minh schema 1 và schema 2 hợp lệ hiện có vẫn được chấp nhận mà không cần field
  schema 3 và không bị mutation trong quá trình validate.
- [ ] AC-008: Fixture/test chứng minh schema version tương lai bị từ chối theo nguyên tắc fail closed.
- [ ] AC-009: Structural validation, toàn bộ unit test, trigger eval và Codex plugin validator đều `PASS` sau
  thay đổi.
- [ ] AC-010: Không triển khai CLI, state-store, event runtime, skill integration hoặc marketplace update trong
  đầu việc này.

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: `AGENTS.md`, `.codex/instructions/common/working-rules.md`,
  `.codex/instructions/common/security.md`, và instruction repository được ánh xạ từ
  `.codex/instructions/repository/overview.md`.
- Validator hiện tại: `scripts/validate.mjs`, trong đó `validateWorkflowState` hỗ trợ schema 1/2 và kiểm tra
  phase, approvals, Git baseline, artifact root cùng remediation limits.
- Test hiện tại: `scripts/validate.test.mjs`; baseline gần nhất là 44/44 test pass.
- Fixture hiện tại: `evals/fixtures/workflow-state/`.
- Template hiện tại: `templates/state.json` dùng schema 2.
- Lệnh xác minh gốc: `node scripts/validate.mjs`, `node --test scripts/validate.test.mjs`,
  `node scripts/run-trigger-evals.mjs`, và plugin validator của `plugin-creator`.
- Git HEAD khi discovery: `a69b02c60ac50f3b0176ef153cc355b621100659`.
- Working tree đã có nhiều thay đổi của người dùng; mọi thay đổi ngoài phạm vi phải được giữ nguyên.

## Căn cứ yêu cầu và quyết định

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| Thực hiện riêng đầu việc thiết kế schema v3 trước các đầu việc controller khác | `USER-CONFIRMED DECISION` | Yêu cầu `Thực hiện đầu việc 2.` và checklist 10 đầu việc trong task hiện tại |
| Schema v3 có revision, approval digest và event anchor | `USER-CONFIRMED DECISION` | Checklist đầu việc 2 đã được người dùng chấp nhận |
| Artifact Markdown dùng SHA-256 với chuẩn hóa CRLF/LF để tránh khác biệt nền tảng | `USER-CONFIRMED DECISION` | Trao đổi kiến trúc và yêu cầu thực hiện đầu việc 2 trong task hiện tại |
| Schema 1 tiếp tục dùng legacy transition rules | `EVIDENCED FACT` | `skills/controlled-development/SKILL.md`, `scripts/validate.mjs`, `scripts/validate.test.mjs` |
| Validation phải fail closed với schema tương lai hoặc state malformed | `EVIDENCED FACT` | `skills/controlled-development/SKILL.md`, `references/definition-of-done.md`, test hiện tại |
| Không thêm controller, app, MCP hoặc SDK trong đầu việc này | `USER-CONFIRMED DECISION` | Checklist và định hướng đã thống nhất trong task hiện tại |

## Giả định triển khai không trọng yếu

1. Tên helper, cách nhóm test và vị trí chính xác của fixture có thể được chọn theo convention hiện tại miễn
   không thay đổi contract đã mô tả.
2. Reference contract mới được đặt dưới `references/` và dùng tiếng Anh cho machine identifiers, tiếng Việt cho
   phần giải thích hướng người dùng khi phù hợp.
3. Không thêm dependency; sử dụng Node.js built-in APIs và validator hiện có.

## Phân loại rủi ro

- Yếu tố cao nhất: `security/data` và `interface`.
- Lý do: thay đổi schema persisted state và compatibility contract ảnh hưởng trực tiếp khả năng resume, approval
  integrity và các đầu việc controller tiếp theo; theo risk matrix, schema/migration và compatibility là High.
- Điều kiện nâng/phạm vi lại: phát hiện cần tự động migrate file cũ, thay đổi semantics phase schema 1/2, thêm
  dependency, hoặc triển khai filesystem mutation/runtime trong đầu việc này.
- Ảnh hưởng hiệu năng: không đáng kể trong phạm vi này vì chỉ validation deterministic trên một JSON state nhỏ;
  không thêm I/O loop, cache, concurrency hoặc external round-trip.

## Ranh giới quyền hạn

- Được phép: tạo workflow artifact cho change này; sửa contract/reference, template, validator, fixture và test
  nằm trong phạm vi sau khi đủ approval gate; chạy kiểm tra cục bộ không có external effect.
- Phải hỏi trước: thêm dependency, mở rộng sang controller/state-store/event runtime, thay đổi build/CI hoặc xóa
  artifact/change hiện có.
- Tuyệt đối không: commit, push, PR, merge, release, deploy, production access, real-data mutation.

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001 đến AC-008 | `node --test scripts/validate.test.mjs` | Test process exit 0 và các test schema/compatibility mới pass |
| AC-006 | Review reference contract và deterministic assertions phù hợp | Nội dung contract khớp exact normalization rules |
| AC-009 | `node scripts/validate.mjs` | Exit 0 và structural validation pass |
| AC-009 | `node scripts/run-trigger-evals.mjs` | Exit 0, toàn bộ trigger case pass |
| AC-009 | `python <plugin-creator>/scripts/validate_plugin.py .` | Exit 0, plugin validation pass |
| AC-010 | Diff review | Không có file/behavior ngoài phạm vi |

## Câu hỏi còn mở

- Không có.

## Phê duyệt

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: `Duyệt spec state-schema-v3 version 1` — 2026-09-18
- Ghi chú phạm vi được duyệt: chỉ contract schema 3, compatibility schema 1/2 và test tương ứng
