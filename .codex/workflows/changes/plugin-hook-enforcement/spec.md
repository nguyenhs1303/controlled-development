# Đặc tả thay đổi: Plugin Hook Enforcement

## Metadata

- Change ID: `plugin-hook-enforcement`
- Workflow profile: `deep`
- Mức rủi ro: `high`
- Trạng thái: `DRAFT - AWAITING SPEC APPROVAL`
- Artifact root: `.codex/workflows/changes/plugin-hook-enforcement/`

## Mục tiêu

Thêm lifecycle hooks vào plugin Controlled Development để cưỡng chế quyết định đã được controller phê duyệt tại
tool boundary. Hook chỉ là adapter enforcement; controller vẫn là nguồn chân lý duy nhất cho phase, approval,
authorization và terminal validity.

## Phạm vi

- Bundle hook configuration và hook runtime cho `SessionStart`, `PreToolUse`, `PostToolUse` và `Stop`.
- Mở rộng controller, workflow rules và state schema để cung cấp execution policy machine-readable.
- Cưỡng chế phase/write permission, task-level path boundary, new-file boundary, protected paths và command grants.
- Phát hiện side effect ngoài phạm vi sau tool call mà không tự động hoàn tác thay đổi của người dùng.
- Ràng buộc verification receipt với implementation diff và làm stale evidence khi diff liên quan thay đổi.
- Ngăn terminal claim khi state, approval, task outcome hoặc evidence chưa hợp lệ.
- Cập nhật permission/evidence/review/Definition of Done và các skill tạo hoặc tiêu thụ execution policy.
- Cập nhật hai plugin manifest, package validator, unit tests, fixtures, behavioral eval và hướng dẫn live integration.
- Hỗ trợ Windows và Unix cho hook commands và command classification trong phạm vi đã kiểm thử.

## Ngoài phạm vi

- Không triển khai `implementation-quality-policy`.
- Không enforcement naming, function size, abstraction, duplication hoặc clean-code semantics.
- Không thêm MCP server, app integration, background automation hoặc dependency mới mặc định.
- Không dùng hook để thay controller, verification, specification-compliance review hoặc engineering review.
- Không stage, commit, push, tạo/cập nhật PR, merge, release, deploy, truy cập production hoặc real data.
- Không cam kết bao phủ hosted tools hay specialized tool paths mà Codex không đưa qua lifecycle hook path.

## Quyết định material xin phê duyệt cùng đặc tả

Phê duyệt version này đồng nghĩa phê duyệt các quyết định sau:

- `D-001`: Mỗi checkout/worktree chỉ có tối đa một active controlled change.
- `D-002`: Mọi profile, kể cả Quick, có runtime state tối thiểu để controller và hook đọc được.
- `D-003`: Command không phân loại được bị deny khi có active controlled change; ngoài active change hook no-op.
- `D-004`: Schema 1/2 không tự migrate và không được coi là enforceable cho BUILD mới; vẫn được đọc/validate theo
  compatibility hiện có và cần reconciliation rõ ràng nếu tiếp tục.
- `D-005`: Hook violation không tự revert file. Controller ghi violation/stale state và dừng continuation phù hợp.
- `D-006`: Controller quản lý active-change lifecycle, execution authorization và terminal authorization; hook không
  đọc Markdown để tự suy luận permission và không sửa trực tiếp controller-owned state.
- `D-007`: Hook disabled, untrusted, không chạy hoặc tool path không được hook bao phủ không được báo cáo là
  enforcement `PASS`.
- `D-008`: Riêng change bootstrap `plugin-hook-enforcement`, BUILD dùng controller và manual boundary hiện có vì hook
  chưa tồn tại. Live installed hook phải active và trusted trước khi live integration được đánh dấu `PASS` và trước
  khi contract này được áp dụng bắt buộc cho controlled change tiếp theo.

## Acceptance criteria

- [ ] `AC-001`: Khi không có active controlled change cho checkout hiện tại, bốn hook event không chặn tool call,
  không tạo workflow state và không thay đổi behavior của task thông thường.
- [ ] `AC-002`: Controller cung cấp active-change lifecycle và một execution-policy contract machine-readable; mỗi
  quyết định allow/deny trả về rule ID ổn định, reason và dữ liệu cần cho audit.
- [ ] `AC-003`: `SessionStart` phân giải active change theo checkout/worktree, thông báo trạng thái enforcement và fail
  closed cho workflow write khi state malformed, future-version, stale hoặc không enforceable; read-only exploration
  vẫn được phép.
- [ ] `AC-004`: `PreToolUse` chặn file write không hợp phase, ngoài `allowedWritePaths`, tạo file ngoài
  `allowedNewFiles`, hoặc chạm protected controller-owned paths; path được normalize và kiểm tra traversal/symlink.
- [ ] `AC-005`: `PreToolUse` phân loại shell/unified-exec commands theo execution policy, chỉ allow command/grant đã
  được controller cấp và deny command không phân loại được trong active workflow. Parser có test Windows và Unix.
- [ ] `AC-006`: `PostToolUse` so sánh side effect với baseline/task contract, phát hiện thay đổi ngoài phạm vi, ghi
  violation/stale metadata qua controller và không tự động hoàn tác user work.
- [ ] `AC-007`: Verification receipt liên kết với implementation diff digest; thay đổi diff liên quan sau receipt làm
  receipt stale và Definition of Done không cho `REVIEW PASSED` đến khi re-verify.
- [ ] `AC-008`: `Stop` cho phép dừng để chờ approval/user input/blocker, nhưng tiếp tục turn khi có terminal claim
  không hợp lệ; `stop_hook_active` hoặc cơ chế tương đương ngăn continuation loop.
- [ ] `AC-009`: Quick có runtime state tối thiểu; schema cũ không bị auto-migrate; state disabled/untrusted/missing
  không được coi là enforcement `PASS`.
- [ ] `AC-010`: Plugin bundle `hooks/hooks.json` hợp lệ, dùng `PLUGIN_ROOT`/`PLUGIN_DATA`, có `commandWindows`, giữ
  hai manifest đồng bộ và package validator không còn cấm hook hợp lệ.
- [ ] `AC-011`: Permission, evidence, review, Definition of Done và các skill liên quan tạo/tiêu thụ cùng một rule ID,
  execution-policy và evidence contract; không duplicate phase matrix trong từng adapter.
- [ ] `AC-012`: Unit/regression tests bao phủ allow, deny, inactive, malformed, stale, bypass, recovery, path security,
  Windows behavior và Stop loop; behavioral eval và package validation có current receipt.
- [ ] `AC-013`: Live installed-plugin test chỉ `PASS` khi hook đã được review/trust và bốn event cần thiết được quan sát;
  nếu không thể trust/install an toàn thì ghi `NOT RUN` hoặc `UNVERIFIED`, không suy diễn từ unit test.

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: `AGENTS.md`, `.codex/instructions/common/working-rules.md`,
  `.codex/instructions/common/security.md`, `.codex/instructions/repository/overview.md`,
  `.codex/instructions/repository/architecture.md`, `.codex/instructions/repository/local-development.md`.
- Plugin root: `.codex/plugins/controlled-development/`.
- Manifest: `plugin.json` và `.codex-plugin/plugin.json`, cùng version `0.1.0+codex.20260918221727` tại discovery.
- Runtime: `scripts/runtime/`; validator: `scripts/validators/`; unit tests: `tests/unit/`; eval:
  `evals/cases/` và `evals/runners/`.
- Native checks: `node scripts/validators/validate-plugin.mjs`,
  `node evals/runners/run-trigger-evals.mjs`, `node --test tests/unit/*.test.mjs`,
  `node evals/runners/run-behavioral-evals.mjs --all --dry-run`.
- Official hook contract: <https://learn.chatgpt.com/docs/hooks> (retrieved 2026-09-22).
- Working tree ban đầu là dirty baseline do người dùng xác nhận đúng và chưa commit; mọi thay đổi ngoài scope phải
  được giữ nguyên.

## Căn cứ yêu cầu và quyết định

| Nội dung | Phân loại trước approval | Nguồn |
|---|---|---|
| Mục tiêu enforcement và non-goals | `USER-CONFIRMED DECISION` | Runbook người dùng cung cấp và yêu cầu chạy Mục tiêu 1 |
| Controller là authority, hook là adapter | `USER-CONFIRMED DECISION` | Runbook `Plugin Hook Enforcement - Phase Guide` |
| Hook events, trust, plugin bundle, env và tool coverage | `EVIDENCED FACT` | Official OpenAI documentation: `/docs/hooks` |
| Deep/high và ba approval gates | `EVIDENCED FACT` | Cross-cutting runtime/authorization/schema/compatibility scope và risk matrix hiện có |
| `D-001` đến `D-008` | `PROPOSAL FOR SPEC APPROVAL` | Khuyến nghị trong runbook và discovery constraints |

## Giả định triển khai không trọng yếu

1. Tiếp tục dùng Node.js ESM và built-in modules nếu solution không chứng minh cần dependency mới.
2. Rule ID dùng chuỗi ASCII ổn định và được centralize trong runtime shared module.
3. Hook output ngắn gọn, không đưa secret/transcript content vào evidence hoặc model-visible context.

## Phân loại rủi ro

- Profile: `deep`; risk level: `high`; solution mode: `full`.
- Yếu tố cao nhất: security/authorization boundary, cross-cutting scope, shared runtime contract, compatibility,
  command parsing và verification cần live installed-plugin behavior.
- Approval bắt buộc: specification, solution và plan.
- Điều kiện xem lại: official hook behavior thay đổi; tool coverage không đủ để cưỡng chế criterion; cần dependency,
  public contract, CI/infrastructure hoặc permission mới; bootstrap exception `D-008` không đủ an toàn.

## Ranh giới quyền hạn

- Được phép sau approval tương ứng: sửa source/test/docs/plugin artifact trong task boundary; chạy local deterministic
  checks; tạo isolated fixture/temp data.
- Phải hỏi riêng: dependency mới/nâng cấp, CI/infrastructure, destructive/external command, credential, public
  interface hoặc scope expansion.
- Tuyệt đối không: git add/commit/push, PR, merge, release, deploy, production access, real-data mutation.

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001..AC-010 | Focused Node unit/integration tests với hook-event fixtures | Exit code, output, changed-file baseline và receipt current |
| AC-011 | Package validator, deterministic contract tests và targeted behavioral eval | Current `PASS` receipts |
| AC-012 | Full plugin unit suite, trigger eval, behavioral dry-run và selected live behavioral eval | Current receipts và coverage mapping |
| AC-013 | Installed-plugin hook review/trust và quan sát live event | Live receipt; nếu không chạy thì `NOT RUN`/`UNVERIFIED` có lý do |

## Câu hỏi còn mở

- Không có câu hỏi bắt buộc trước P6. Các quyết định material `D-001` đến `D-008` được trình bày rõ để người dùng
  chấp thuận, sửa hoặc từ chối tại `SPEC APPROVAL`.

## Phê duyệt

- Quyết định: `PENDING`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: chờ phản hồi P6 trong task hiện tại
- Ghi chú: approval phải áp dụng cho đúng nội dung và digest của file này.
