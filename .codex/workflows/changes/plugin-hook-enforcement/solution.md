# Thiết kế giải pháp: Plugin Hook Enforcement

## Metadata

- Change ID: `plugin-hook-enforcement`
- Chế độ: `FULL SOLUTION`
- Tham chiếu đặc tả đã duyệt: spec approval revision 2, digest `sha256:345150151c808717c7df9db3594ee3bcd5384857692739444dd36f137dc71156`
- Phiên bản giải pháp: `SOLUTION-001`

## Bối cảnh quyết định

Change cần đưa các boundary đã được controller phê duyệt tới Codex tool lifecycle mà không tạo workflow engine thứ
hai trong hook. Runtime hiện có state schema, controller, ledger và validators nhưng chưa có hooks bundle, execution
policy, active-change binding, task-level authorization hoặc side-effect audit.

## Bằng chứng và ràng buộc

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| Hook bundle mặc định nằm ở `hooks/hooks.json`, manifest có thể override | `EVIDENCED` | Official docs `/docs/hooks`, EVID-DISC-002 |
| Hook input là JSON stdin; PreToolUse có thể deny/rewrite; PostToolUse không undo side effect | `EVIDENCED` | Official docs `/docs/hooks`, EVID-DISC-002 |
| Trust theo hash, disabled/untrusted hook không chạy; `PLUGIN_ROOT`/`PLUGIN_DATA` và `commandWindows` có sẵn | `EVIDENCED` | Official docs `/docs/hooks`, EVID-DISC-002 |
| Controller sở hữu phase, approval, state transition và ledger | `EVIDENCED` | `scripts/runtime/workflow-controller-core.mjs`, `workflow-ledger.mjs`, approved spec |
| Không được mutate `phase`, approval, revision trực tiếp | `USER CONFIRMED` | Repository rules và approved spec D-006 |
| Không commit/stage/ship | `USER CONFIRMED` | `AGENTS.md`, approved spec |

## Decision drivers

| Driver | Mức bắt buộc | Bằng chứng/nguồn |
|---|---|---|
| Controller là authority duy nhất; hook mỏng | `MUST` | Approved spec, runbook architecture principle |
| Fail closed cho active workflow writes, no-op ngoài active change | `MUST` | AC-001, AC-003, AC-005, AC-009 |
| Không tự revert user work; audit được side effect | `MUST` | AC-006, official PostToolUse limitation |
| Bảo toàn baseline dirty files và schema compatibility | `MUST` | Existing `gitBaseline` contract, D-004, repository baseline |
| Không thêm dependency mặc định | `MUST` | Approved spec, permission policy |
| Windows/Unix và plugin trust/install đều phải kiểm chứng | `MUST` | AC-005, AC-010, AC-013 |
| Từng rule có ID ổn định, dễ test và evidence | `MUST` | AC-002, AC-011 |

## Quality scenarios

| Thuộc tính | Scenario đo được | Trạng thái bằng chứng |
|---|---|---|
| Security/correctness | Với active state hợp lệ, một PreToolUse write ngoài task boundary trả deny chứa rule ID và tool không chạy | `EVIDENCED` contract; runtime `HYPOTHESIS` đến khi test |
| Isolation | Không có active change, cùng tool input không tạo state và không bị deny | `EVIDENCED` requirement; runtime `HYPOTHESIS` đến khi test |
| Recovery | Sau diff ngoài scope, PostToolUse ghi violation/stale nhưng file người dùng vẫn còn nguyên | `EVIDENCED` PostToolUse limitation; runtime `HYPOTHESIS` đến khi test |
| Integrity | Mỗi receipt cũ sau implementation diff change bị đánh `stale`, terminal claim bị từ chối | `EVIDENCED` approved spec; runtime `HYPOTHESIS` đến khi test |
| Loop safety | Stop hook với `stop_hook_active=true` không tạo thêm continuation | `EVIDENCED` official docs; runtime `HYPOTHESIS` đến khi test |
| Performance | Hook command synchronous chỉ dùng local state/diff và timeout cấu hình; chưa có workload/SLO được phê duyệt | `UNKNOWN` về số đo; không đặt target mới |

## Các giải pháp được xem xét

### Option 1: Controller-owned execution policy + thin synchronous hook adapters (khuyến nghị)

- Lý do được xem xét: phù hợp trực tiếp với architecture principle và boundary controller/hook trong spec.
- Kiến trúc cấp cao: controller đọc state + policy; shared runtime authorization engine trả decision envelope;
  `SessionStart` resolve context; `PreToolUse` authorize; `PostToolUse` audit/stale; `Stop` validate continuation;
  adapters chỉ parse stdin/serialize stdout và gọi engine.
- Pattern/công nghệ: shared policy/decision module, immutable rule IDs, JSON stdin/stdout, Node.js built-ins; không
  thêm dependency.
- Ưu điểm: không duplicate phase matrix, test deterministic, dễ map decision tới evidence, giữ authority tập trung.
- Nhược điểm: cần mở rộng state schema và controller contract; live trust/install test phức tạp.
- Performance và quality impact: mỗi synchronous hook thêm local process/state/diff cost; `INFERRED`, cần timeout và
  focused integration test, không có SLO được suy diễn.
- Rủi ro/migration/rollback: schema mới không auto-migrate; bootstrap exception cho change này; rollback cục bộ là
  disable hook bundle và giữ controller/validator code, không revert user files.
- Bằng chứng và điểm chưa chắc chắn: `EVIDENCED` về ownership/hook contract; `HYPOTHESIS` về runtime timings.

### Option 2: Hook tự đọc Markdown workflow và tự suy luận permission

- Lý do được xem xét: có thể giảm số field schema ban đầu.
- Kiến trúc cấp cao: mỗi adapter đọc spec/plan/state Markdown và tự parse phase/path/command.
- Pattern/công nghệ: ad-hoc parser trong hook; không thêm dependency.
- Ưu điểm: ít controller API mới ở ngắn hạn.
- Nhược điểm: vi phạm authority boundary, dễ drift giữa adapters, không deterministic với prose, khó audit và fail
  closed; bị loại bởi D-006 và AC-011.
- Performance và quality impact: nhiều I/O/parse không ổn định; `INFERRED`.
- Rủi ro/migration/rollback: false allow/deny, bypass controller; rollback không sửa được authority duplication.
- Bằng chứng và điểm chưa chắc chắn: loại trừ bởi approved spec, không phải option hợp lệ để triển khai.

## So sánh trade-off

| Tiêu chí | Option 1 | Option 2 | Căn cứ |
|---|---|---|---|
| Authority/không duplicate | `PASS` | `FAIL` | Approved spec D-006, AC-011 |
| Fail closed và audit | `PASS` | `UNKNOWN/FAIL` | Controller contract + official hook output |
| Dependency impact | `PASS - none` | `PASS - none` | Permission policy |
| Migration/compatibility | `MEDIUM` | `HIGH` | State schema và prose parsing |
| Testability | `PASS` | `LOW` | Existing Node unit/eval harness |
| Live hook integration | `MEDIUM` | `MEDIUM` | Official trust/install contract |

## Giải pháp khuyến nghị

- Option: `Option 1 - Controller-owned execution policy + thin synchronous hook adapters`.
- Lý do: là lựa chọn duy nhất thỏa authority, fail-closed, auditability, testability và không-dependency drivers.
- Phần còn là giả thuyết: chi phí runtime và chi tiết host trust/install phải xác minh trong VERIFY/live integration.
- Phần cần người dùng quyết định: không còn ngoài các approval gate của workflow.

## Kiến trúc được đề xuất

- Boundary/component:
  - `workflow-state`/validator: schema version, active binding, execution policy, receipts và stale markers.
  - `workflow-controller-core`: lifecycle resolve, authorization API, rule IDs, terminal validation và ledger writes.
  - `hooks/runtime`: shared event parser, path/command classifier, decision envelope và platform command launcher.
  - `hooks/hooks.json`: synchronous event mappings; manifest khai báo bundle path.
  - `skills/policies/evals`: tạo/tiêu thụ machine-readable contract, không chứa policy duplicate.
- Data/runtime flow: Codex event stdin → adapter parse → controller resolve active change/policy → decision envelope →
  allow/deny/context; PostToolUse lấy tool response và current diff để ghi audit/stale; Stop kiểm tra terminal gate và
  loop flag.
- Architectural/design pattern: thin adapter + centralized policy decision; pattern giải quyết drift/authority
  duplication và áp dụng tại `hooks/runtime` + `workflow-controller-core`; không tạo abstraction song song.
- C4/dynamic/deployment view: không cần diagram riêng; flow trên đủ cho component boundary và sequence mapping.

## Công nghệ và dependency

| Thay đổi | Loại | Lý do | Permission |
|---|---|---|---|
| `hooks/hooks.json` và hook runtime Node.js | `new` | Plugin lifecycle bundle | `NOT REQUIRED` trong approved scope |
| `plugin.json` và `.codex-plugin/plugin.json` hooks entry | `change` | Manifest discovery | `NOT REQUIRED` trong approved scope |
| State schema/execution policy/controller modules | `change` | Central authorization | `NOT REQUIRED` trong approved scope |
| External package/dependency | `none` | Built-in Node.js đủ theo evidence hiện tại | `NOT REQUIRED` |
| Live install/trust operation | `change` | AC-013 | `REQUIRED` nếu host yêu cầu external/credential action; nếu không an toàn ghi `NOT RUN` |

## Verification conditions

| Claim/driver | Cách xác minh | Kết quả cần quan sát |
|---|---|---|
| Hook config/manifest hợp lệ | package validator + config fixtures | validator `PASS`, no manifest drift |
| Controller contract | Node unit tests | rule IDs, decisions, ledger/state integrity pass |
| File/path enforcement | unit + temp fixture tests | allow/deny, traversal/symlink, dirty baseline outcomes pass |
| Command enforcement | Windows + Unix fixture tests | classified allow, unclassified deny, protected commands deny |
| Side-effect/stale | PostToolUse fixture + controller tests | violation recorded, receipt stale, files not reverted |
| Stop | event fixture tests | approval wait allowed, invalid terminal blocked, loop prevented |
| Inactive/trust | inactive fixture + installed plugin check | no-op inactive; live `PASS` only after trusted hooks observed |
| Regression | native validator, trigger eval, all unit tests, selected behavioral eval | current receipts after final diff |

## Consequences và technical debt

- Tích cực: permission boundary machine-readable, centralized, auditable; hook adapters nhỏ; compatibility và dirty
  baseline rõ ràng; tests có thể chạy local.
- Tiêu cực: schema/controller surface lớn hơn; synchronous hook failure/timeout cần UX rõ; live trust phụ thuộc host.
- Technical debt chấp nhận: chưa bao phủ hosted/specialized tool paths ngoài official local hook coverage; chưa triển
  khai clean-code policy; performance chưa có benchmark vì chưa có approved workload/SLO.

## Revisit conditions

- Official hook schema/tool coverage hoặc trust behavior thay đổi.
- Controller cần quyền ngoài local checkout hoặc state schema cần migration.
- Synchronous hook latency/timeout trở thành vấn đề qua receipt/measurement thực tế.
- Có yêu cầu hosted tool, MCP server, CI/infrastructure, public interface hoặc dependency mới.

## Câu hỏi còn mở

- Không có câu hỏi material cần trả lời trước approval; live integration có thể kết thúc `NOT RUN`/`UNVERIFIED` nếu
  host không cho phép trust/install an toàn.

## Phê duyệt giải pháp

- Quyết định: `PENDING`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: chờ P8 `SOLUTION APPROVAL`
- Ghi chú: approval áp dụng cho `SOLUTION-001` và đúng digest artifact hiện tại.
