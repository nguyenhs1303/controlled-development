# Kế hoạch triển khai: Plugin Hook Enforcement

## Metadata

- Change ID: `plugin-hook-enforcement`
- Tham chiếu phê duyệt đặc tả: revision 2, digest `sha256:345150151c808717c7df9db3594ee3bcd5384857692739444dd36f137dc71156`
- Tham chiếu phê duyệt giải pháp: revision 5, `SOLUTION-001`
- Mức rủi ro: `high`
- Bắt buộc phê duyệt kế hoạch: `yes`
- Plan version: `PLAN-001`
- Task contract: `tasks.md` digest `sha256:2eda5190d3d5abff567e65d7868c0534472d28be8518e939550b6b85312da961`

## Cách tiếp cận

Triển khai theo lát dọc test-first: thiết lập package hook contract, event harness và schema/controller foundation trước;
sau đó thêm từng event (`SessionStart`, file-write `PreToolUse`, command `PreToolUse`, `PostToolUse`, `Stop`), rồi cập
nhật policy/skill/eval và chạy verification. Mỗi adapter dùng cùng authorization engine và rule IDs, không chứa phase
matrix riêng.

## Truy vết giải pháp đã duyệt

| Task/Quyết định | Solution section | Acceptance criterion | Bằng chứng/nguồn |
|---|---|---|---|
| TASK-001..003 | Package contract, schema foundation | AC-002, AC-009, AC-010 | Official hooks docs + approved solution |
| TASK-004..005 | Controller authorization, active lifecycle | AC-002, AC-003 | Controller ownership decision |
| TASK-006..011 | Four hook events and shared enforcement | AC-001, AC-003..010 | Official event contract + approved solution |
| TASK-012..016 | Policy và skill consumers | AC-007, AC-009, AC-011 | Approved specification/solution |
| TASK-017..019 | Docs, eval, verification/live integration | AC-012, AC-013 | Native command discovery + evidence policy |

## Sơ đồ phụ thuộc

```text
TASK-001 package contract
  -> TASK-002 event fixtures/harness
  -> TASK-003 schema v4 + execution-policy contract
  -> TASK-004 authorization engine + rule IDs
  -> TASK-005 active-change lifecycle/readiness proof
  -> TASK-006 SessionStart
  -> TASK-007 PreToolUse file paths
  -> TASK-008 PreToolUse commands
  -> TASK-009 PostToolUse side-effect audit/baseline
  -> TASK-010 diff-bound evidence freshness
  -> TASK-011 Stop/terminal validation
  -> TASK-012 policies/Definition of Done
  -> TASK-013 controlled-development orchestration
  -> TASK-014 discovery/planning producers
  -> TASK-015 build/verification consumers
  -> TASK-016 review consumers
  -> TASK-017 README/package/trust guidance
  -> TASK-018 behavioral eval coverage
  -> TASK-019 full verification + optional live installed-plugin test
```

## Danh sách task

| Task | Acceptance criteria | Phụ thuộc | File dự kiến | Xác minh |
|---|---|---|---|---|
| TASK-001 | AC-010 | None | manifests, `hooks/`, validator/test | focused validator test |
| TASK-002 | AC-012 | 001 | hook fixtures/harness/test | hook harness unit test |
| TASK-003 | AC-002,009 | 002 | schema/template/validator/tests | state schema tests |
| TASK-004 | AC-002 | 003 | rule IDs, execution policy, controller/tests | authorization unit tests |
| TASK-005 | AC-001,003,009 | 004 | active binding/readiness/controller/tests | lifecycle tests |
| TASK-006 | AC-001,003,010 | 005 | shared hook runtime/SessionStart tests | SessionStart fixture tests |
| TASK-007 | AC-004 | 006 | path policy/PreToolUse tests | path/traversal/symlink tests |
| TASK-008 | AC-005 | 007 | command policy/PreToolUse tests | Windows/Unix command tests |
| TASK-009 | AC-006 | 008 | snapshot/PostToolUse/controller/tests | side-effect and dirty-baseline tests |
| TASK-010 | AC-007 | 009 | diff digest/evidence validation/tests | stale receipt tests |
| TASK-011 | AC-008 | 010 | Stop authorization/runtime/tests | approval wait/terminal/loop tests |
| TASK-012 | AC-007,009,011 | 011 | policy/schema references | package validator + link checks |
| TASK-013 | AC-011 | 012 | controlled-development skill | deterministic/behavioral contract test |
| TASK-014 | AC-002,004,005,011 | 013 | discovery/planning skills | targeted evals |
| TASK-015 | AC-004..007,011 | 014 | build/verification skills | targeted evals |
| TASK-016 | AC-007,008,011 | 015 | review skills/DoD | targeted evals |
| TASK-017 | AC-010,013 | 016 | README/eval docs/package guidance | validator + manual doc review |
| TASK-018 | AC-012 | 017 | eval cases/fixtures/runner mappings | trigger + behavioral dry-run/selected eval |
| TASK-019 | AC-001..013 | 018 | no planned source beyond fixes in scope | full native checks + optional live test |

## Checkpoint

- CP-1 sau TASK-003: package và schema foundation pass, không có hook enforcement behavior giả.
- CP-2 sau TASK-006: inactive no-op và SessionStart state resolution pass.
- CP-3 sau TASK-011: bốn event và controller decision path pass focused tests.
- CP-4 sau TASK-016: policy/skill contract đồng bộ và package validator pass.
- CP-5 sau TASK-019: full verification receipts hiện hành; live test trung thực `PASS`, `NOT RUN` hoặc `UNVERIFIED`.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| False allow từ parser/path normalization | Vượt permission boundary | Conservative classifier, unknown deny, traversal/symlink/platform tests |
| False deny làm kẹt workflow | Không thể BUILD/approval wait | Inactive no-op, controller reason/rule IDs, Stop approval-wait cases, bootstrap exception |
| Dirty baseline bị nhầm là side effect | Đụng user work | Snapshot/hash pre-existing dirty files, compare delta, không auto-revert |
| State/artifact tự làm baseline stale | Resume luôn fail | Exclude controller-owned artifacts và bind authorized implementation snapshot riêng |
| Hook untrusted/disabled nhưng báo pass | Enforcement giả | Runtime nonce/readiness proof, live receipt requirement, honest non-pass status |
| Stop continuation loop | Turn không kết thúc | `stop_hook_active`, single continuation, blocker/system warning fallback |
| Existing broad uncommitted changes | Merge/conflict/scope confusion | Preserve baseline; inspect before each write; stop on unexpected external change |

## Rollback/Phục hồi

- Không dùng Git destructive operations hoặc tự revert user work.
- Mỗi task giữ checkpoint xanh; nếu task fail, sửa trong file boundary hoặc ghi blocker sau tối đa ba hypothesis khác nhau.
- Hook bundle có thể bị vô hiệu hóa cục bộ bằng source rollback trong working tree chỉ khi nằm trong approved remediation;
  không sửa user trust/config để che lỗi.
- Violation sau tool call được ghi và reconcile thủ công; file không bị xóa/khôi phục tự động.

## Permission notes

- Không có dependency, migration, CI, infrastructure, public API hoặc production operation trong plan.
- Live installed-plugin install/reinstall/trust làm thay đổi user-scope runtime; phải hỏi người dùng ngay trước bước đó.
- Nếu không được phép hoặc host không hỗ trợ an toàn, TASK-019 ghi live integration `NOT RUN`/`UNVERIFIED`.

## Phê duyệt kế hoạch

- Quyết định: `PENDING`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: chờ P10 `PLAN APPROVAL`
- Ghi chú: approval áp dụng cho `PLAN-001`, task order và file boundary trong `tasks.md` cùng digest hiện tại.
