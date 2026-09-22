# Plugin Hook Enforcement - Phase Guide

## Mục đích

Tài liệu này là runbook để thực hiện thay đổi `plugin-hook-enforcement` theo workflow Deep của Controlled
Development. Nó giúp tiếp tục công việc sau khi context bị compact hoặc task được mở lại.

Tài liệu này không phải specification, solution, plan hay approval record. Không được dùng nội dung trong file
này để tự chuyển phase, tự cấp quyền ghi hoặc bắt đầu BUILD.

## Kết quả mong muốn

Thêm lifecycle hooks vào plugin Controlled Development để cưỡng chế các ranh giới đã được controller phê duyệt:

- chỉ enforcement khi có controlled change đang active;
- chặn ghi sai phase hoặc ngoài phạm vi task;
- chặn command bị cấm hoặc chưa được cấp quyền;
- phát hiện side effect ngoài phạm vi sau tool call;
- làm stale evidence khi implementation diff thay đổi;
- ngăn terminal claim khi state hoặc evidence chưa hợp lệ.

## Ngoài phạm vi

- Chưa triển khai `implementation-quality-policy`.
- Chưa kiểm tra naming, function size, abstraction, duplication hoặc clean-code semantics.
- Không thêm MCP server, app integration hoặc background automation.
- Không stage, commit, push, tạo PR, merge, release hoặc deploy.
- Không dùng hook để thay thế controller, verification hoặc engineering review.

## Nguyên tắc kiến trúc bắt buộc

```text
Policy định nghĩa luật
Controller quyết định ALLOW hoặc DENY
Hook cưỡng chế quyết định tại tool boundary
Skill điều phối workflow và xử lý judgment
Verification tạo evidence và receipt
Review đánh giá correctness và chất lượng ngữ nghĩa
```

- Hook không tự đọc Markdown rồi suy luận permission.
- Hook không tự chuyển phase hoặc sửa trực tiếp workflow state.
- Controller là nguồn chân lý duy nhất cho phase, approval và authorization.
- Hook phải no-op khi không có active controlled change.
- State không hợp lệ: cho phép khám phá read-only, chặn thao tác ghi thuộc workflow.
- Hook bị disabled, untrusted hoặc không chạy không được xem là enforcement `PASS`.
- Mỗi rule có ID ổn định dùng chung trong policy, controller, hook, test và evidence.

## Thành phần phải được cập nhật

1. Hook configuration và hook runtime.
2. Workflow controller và workflow rules.
3. Workflow state schema và validator.
4. Permission policy.
5. `controlled-development` orchestrator skill.
6. `project-discovery` và `implementation-planning`.
7. `incremental-build`.
8. `change-verification`.
9. `spec-compliance-review`, `engineering-review` và Definition of Done.
10. README, package validator, unit tests, fixtures, behavioral eval và local integration guidance.

## Các quyết định cần được chốt trong specification

Khuyến nghị mặc định, nhưng chỉ có hiệu lực sau khi được người dùng phê duyệt trong spec:

- Mỗi checkout/worktree chỉ có một active controlled change.
- Mọi profile, kể cả Quick, có runtime state tối thiểu để hook đọc.
- Hook enforcement phải active và trusted trước khi vào BUILD.
- Command không phân loại được bị chặn trong active workflow.
- Schema cũ không được tự động migrate hoặc âm thầm coi là enforceable.
- Hook violation không được tự động hoàn tác file của người dùng.
- Controller quản lý active-change lifecycle và terminal authorization.

---

## Phase 1 - BOOTSTRAP

### Mục tiêu

Xác lập repository context, trạng thái working tree và nguồn state trước mọi thao tác ghi.

### Việc phải làm

- Đọc `AGENTS.md` và toàn bộ repository instructions áp dụng.
- Kiểm tra Git status và ghi nhận thay đổi có sẵn của người dùng.
- Xác định plugin root, hai manifest, runtime scripts, validators, tests và evals.
- Kiểm tra controlled change cùng tên đã tồn tại hay chưa.
- Nếu resume, chạy controller `check-resume` trước mọi ghi file.
- Ghi nhận repository bootstrap placeholders nhưng không tự chạy `$repository-bootstrap`.

### Đầu ra

- Repository context và Git baseline có bằng chứng.
- Danh sách thay đổi có sẵn cần bảo toàn.
- Kết luận bắt đầu mới hay resume.

### Điều kiện thoát

- Không có state mơ hồ hoặc xung đột chưa được xử lý.
- Chưa sửa product/plugin source.

---

## Phase 2 - INTAKE

### Mục tiêu

Chốt outcome, phạm vi cấp cao, non-goals và giới hạn quyền hạn.

### Việc phải làm

- Xác nhận mục tiêu là workflow/permission enforcement, chưa phải clean-code enforcement.
- Ghi rõ hook không được ảnh hưởng task ngoài active controlled change.
- Ghi rõ controller là authority, hook chỉ là adapter enforcement.
- Ghi lại các giới hạn: không shipping, không dependency mới mặc định, không production access.
- Tách dữ kiện, đề xuất và câu hỏi chưa được xác nhận.

### Đầu ra

- Intake statement.
- Scope và non-goals ban đầu.
- Danh sách câu hỏi material cần giải quyết trong DEFINE.

### Điều kiện thoát

- Outcome đủ rõ để khám phá có trọng tâm.

---

## Phase 3 - DISCOVER

### Mục tiêu

Thu thập bằng chứng cần thiết để thiết kế hook mà không suy diễn từ tên file.

### Việc phải làm

- Đọc tài liệu hooks chính thức của OpenAI cho plugin-bundled hooks.
- Xác nhận event schema và behavior của `SessionStart`, `PreToolUse`, `PostToolUse` và `Stop`.
- Xác nhận trust, disable, `PLUGIN_ROOT`, `PLUGIN_DATA`, `commandWindows` và tool coverage.
- Đọc controller, workflow rules, state validator và event ledger hiện tại.
- Đọc permission, evidence, review và Definition of Done policies.
- Đọc các skill tạo hoặc tiêu thụ scope, task, command và evidence.
- Xác định validator/test hiện đang cấm cấu trúc hook.
- Xác định native validation, unit-test và behavioral-eval commands.
- Xác định manifest, generated paths, secret-bearing paths và package update flow.

### Bằng chứng discovery phải tạo ra

- Bản đồ runtime execution path.
- Bản đồ file có khả năng bị ảnh hưởng.
- Danh sách dữ liệu hook cần nhưng state hiện chưa có.
- Danh sách command và path cần machine-readable classification.
- Rủi ro backward compatibility và cross-platform.

### Điều kiện thoát

- Đủ bằng chứng để phân loại rủi ro và viết acceptance criteria.
- Mọi khoảng trống material được nêu rõ, không biến thành assumption ngầm.

---

## Phase 4 - TRIAGE

### Mục tiêu

Phân loại profile và approval gates bằng bằng chứng.

### Kết quả khuyến nghị

```text
profile: deep
riskLevel: high
specApprovalRequired: true
solutionApprovalRequired: true
planApprovalRequired: true
```

### Lý do

- Thay đổi runtime enforcement và permission boundary.
- Ảnh hưởng nhiều skill, controller, schema và validator.
- Có nguy cơ false allow, false deny và chặn nhầm user work.
- Có backward-compatibility và hook-trust concerns.

### Điều kiện thoát

- Risk factors và approval gates được ghi có bằng chứng.

---

## Phase 5 - DEFINE

### Mục tiêu

Viết specification có thể kiểm chứng cho `plugin-hook-enforcement`.

### Artifact

```text
.codex/workflows/changes/plugin-hook-enforcement/spec.md
.codex/workflows/changes/plugin-hook-enforcement/state.json
.codex/workflows/changes/plugin-hook-enforcement/evidence.md
```

Chỉ tạo hoặc cập nhật specification sau khi có write consent rõ ràng.

### Specification phải định nghĩa

- Activation và deactivation lifecycle.
- Hành vi khi không có active change.
- Hành vi khi state thiếu, sai hoặc stale.
- Phase/write permission matrix.
- Task-level path và new-file boundaries.
- Command classification và permission grants.
- Protected controller-owned paths.
- Post-tool side-effect detection.
- Diff hash và stale receipt behavior.
- Stop behavior cho approval wait, blocker và terminal claim.
- Hook disabled/untrusted behavior.
- Schema compatibility và migration policy.
- Security, path traversal, symlink và shell parsing requirements.
- Acceptance criteria và test scenarios.

### Điều kiện thoát

- Không còn câu hỏi material bị trình bày như fact.
- Mọi acceptance criterion có cách tạo bằng chứng.

---

## Phase 6 - SPEC APPROVAL

### Mục tiêu

Nhận approval rõ ràng cho đúng version của specification.

### Việc phải làm

- Trình bày scope, non-goals, behavior quan trọng và unresolved risks.
- Dừng lượt để chờ người dùng phê duyệt.
- Ghi approval bằng controller và lưu receipt.
- Nếu spec thay đổi, tạo digest mới và yêu cầu duyệt lại.

### Điều kiện thoát

- Specification hiện tại có approval hợp lệ và digest khớp.

---

## Phase 7 - SOLUTION DESIGN

### Mục tiêu

Thiết kế kiến trúc enforcement mà không tạo workflow logic thứ hai trong hook.

### Solution phải bao gồm

- Active-change ownership và storage model.
- Schema version mới và execution-policy contract.
- Task-level `allowedWritePaths`, `allowedNewFiles` và `requiredChecks`.
- Controller authorization APIs.
- Rule ID taxonomy.
- Hook runtime adapter và shared event parser.
- `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop` mapping.
- Fail-open/fail-closed matrix.
- Command parsing strategy trên Windows và Unix.
- Baseline dirty-file protection.
- Diff/evidence binding.
- Stop-loop prevention.
- Trust, disable, reinstall và cachebuster behavior.
- Compatibility strategy cho schema cũ và Quick profile.

### Kiến trúc mục tiêu

```text
Project evidence + approved plan
              ↓
Machine-readable execution policy
              ↓
Controller authorization engine
              ↓
Thin hook adapters
              ↓
Codex tool calls
```

### Điều kiện thoát

- Các option, trade-off và recommendation có bằng chứng.
- Ownership của từng field và quyết định được xác định duy nhất.

---

## Phase 8 - SOLUTION APPROVAL

### Mục tiêu

Nhận approval rõ ràng cho architecture, schema và failure behavior.

### Điều kiện thoát

- Solution version hiện tại được controller ghi approval.
- Không dùng solution approval để tự cấp dependency, migration hoặc external permission.

---

## Phase 9 - PLAN

### Mục tiêu

Chia solution thành các increment nhỏ, test-first và có phạm vi file xác định.

### Task order đề xuất

1. Cho phép và validate `hooks/hooks.json` trong package validator.
2. Thêm hook event fixtures và shared test harness.
3. Thêm schema/execution-policy fields và state validation.
4. Thêm controller authorization engine và rule IDs.
5. Thêm active-change lifecycle và state resolution.
6. Thêm `SessionStart` adapter.
7. Thêm `PreToolUse` file-write enforcement.
8. Thêm `PreToolUse` command enforcement.
9. Thêm `PostToolUse` side-effect audit và stale receipt handling.
10. Thêm `Stop` terminal validation và loop protection.
11. Cập nhật permission/evidence/review/Definition of Done policies.
12. Cập nhật `controlled-development`.
13. Cập nhật `project-discovery` để phân loại command và protected paths.
14. Cập nhật `implementation-planning` để tạo task execution contract.
15. Cập nhật `incremental-build` và `change-verification`.
16. Cập nhật `spec-compliance-review` và `engineering-review`.
17. Cập nhật README, package structure và local install/trust guidance.
18. Thêm unit tests, regression tests và behavioral evals.
19. Chạy package validation và live hook integration test.

### Mỗi task phải ghi

- dependencies;
- allowed files và allowed new files;
- test RED;
- implementation boundary;
- GREEN/regression commands;
- acceptance criteria;
- permission notes;
- rollback/reconciliation behavior.

### Điều kiện thoát

- Không còn task chung chung như “update skills”.
- Mười nhóm thành phần đều có task owner và verification tương ứng.

---

## Phase 10 - PLAN APPROVAL

### Mục tiêu

Nhận approval cho đúng task order, file boundary và sensitive operations.

### Điều kiện thoát

- Plan hiện tại được duyệt và controller ghi approval receipt.
- Không suy rộng approval sang file, command hoặc dependency ngoài plan.

---

## Phase 11 - BUILD

### Mục tiêu

Triển khai từng increment nhỏ và giữ working tree có thể xác minh.

### Chu kỳ cho mỗi task

```text
Claim task
→ xác nhận file boundary
→ viết test RED
→ triển khai tối thiểu
→ chạy GREEN
→ refactor trong scope
→ chạy regression được giao
→ ghi evidence/receipt
→ đóng task
```

### Quy tắc BUILD

- Không triển khai tất cả hook trong một task lớn.
- Không sao chép phase matrix vào từng hook adapter.
- Không sửa trực tiếp controller-owned state.
- Không thêm dependency nếu chưa có permission riêng.
- Không tự sửa file ngoài task scope khi phát hiện vấn đề lân cận.
- Khi kiến trúc hoặc schema cần đổi material, quay lại Solution Approval.
- Tối đa ba recovery attempts khác nhau cho cùng blocker.

### Điều kiện thoát

- Mọi implementation task có terminal status và evidence.
- Không còn scope violation chưa reconcile.

---

## Phase 12 - VERIFY

### Mục tiêu

Tạo bằng chứng thực thi cho behavior, compatibility và package integrity.

### Kiểm tra bắt buộc

- Plugin/package validator.
- Workflow state/schema unit tests.
- Controller authorization tests.
- Hook JSON/configuration tests.
- Hook event fixture tests.
- Phase/path/new-file enforcement tests.
- Command allow/deny tests.
- Path traversal và symlink tests khi nền tảng hỗ trợ.
- Windows command behavior.
- Post-tool side-effect detection.
- Diff hash và stale receipt tests.
- Stop approval-wait và terminal-claim tests.
- Stop-loop prevention.
- Hook inactive không ảnh hưởng task thường.
- Selected behavioral evals.
- Live installed-plugin test sau khi review/trust hook.

### Trạng thái evidence

- `PASS`: command thực sự chạy thành công và receipt còn current.
- `FAIL`: command thực sự chạy và thất bại.
- `NOT RUN`: không chạy được hoặc không an toàn, có lý do.
- `UNVERIFIED`: evidence gián tiếp hoặc chưa đủ.

### Điều kiện thoát

- Required checks có current receipts hoặc non-pass status trung thực.
- Không suy diễn live integration `PASS` từ unit test.

---

## Phase 13 - REVIEW

### Mục tiêu

Kiểm tra cả spec compliance và chất lượng kỹ thuật sau verification.

### Thứ tự

1. `spec-compliance-review`.
2. `engineering-review`.

### Trọng tâm review

- Hook không ảnh hưởng task ngoài active workflow.
- Controller và hook không duplicate business rules.
- Không có direct-state mutation hoặc authority bypass.
- Path normalization, traversal và symlink được xử lý đúng.
- Command classification có failure behavior rõ.
- Post-tool violation không tự phá user work.
- Hook disabled/untrusted được báo đúng.
- State cũ và Quick behavior phù hợp contract.
- Stop không ngăn approval wait và không tạo vòng lặp.
- Test bao phủ allow, deny, stale, bypass và recovery paths.

### Điều kiện thoát

- Findings có evidence, severity, trigger và remediation eligibility.
- Suggestions không tự gây code change.

---

## Phase 14 - AUTO-REMEDIATE / RE-VERIFY / RE-REVIEW

### Mục tiêu

Khắc phục finding nghiêm trọng đã được chứng minh trong phạm vi duyệt.

### Chỉ được tự sửa khi

- Finding là `Critical` hoặc `Important`.
- Có trigger và bằng chứng cụ thể.
- Fix nằm trong approved scope.
- Không cần dependency, permission hoặc product judgment mới.

### Chu kỳ

```text
AUTO-REMEDIATE
→ RE-VERIFY
→ RE-REVIEW
```

Tối đa ba chu kỳ. Hết giới hạn thì chuyển `REVIEW BLOCKED`.

---

## Phase 15 - LEARNING RETROSPECTIVE

### Mục tiêu

Đánh giá thay đổi có tạo bài học workflow bền vững hay không.

### Quy tắc

- Chỉ chạy sau verification và review sạch.
- Không tự sửa plugin thêm trong retrospective.
- Candidate chỉ là proposal có regression eval đề xuất.
- Không dùng sự im lặng hoặc độ khó làm bằng chứng.

### Điều kiện thoát

- Có đúng một retrospective classification.

---

## Phase 16 - FINAL REPORT

### Mục tiêu

Tổng hợp kết quả và giới hạn còn lại bằng evidence hiện tại.

### Báo cáo phải có

- File đã thay đổi.
- Hook events và enforcement đã thêm.
- Controller/schema/policy/skill updates.
- Verification commands và receipts.
- Live integration và trust status.
- Unverified items và residual risks.
- Review/remediation cycle count.
- Nội dung để lại cho `implementation-quality-policy`.
- Xác nhận không có shipping operation.

### Terminal state hợp lệ

- `REVIEW PASSED`
- `REVIEW BLOCKED`
- `IMPLEMENTATION BLOCKED`

---

## Phase 17 - STOP

### Mục tiêu

Đóng controlled change sau final report hợp lệ.

### Việc phải làm

- Controller ghi terminal state và transition hợp lệ.
- Deactivate active-change marker/runtime binding.
- Không commit, push, PR, release hoặc deploy.
- Mọi thay đổi tiếp theo bắt đầu bằng controlled change mới.

---

## Ma trận trách nhiệm cuối cùng

| Thành phần | Tạo dữ liệu/quyết định | Thực thi/tiêu thụ |
|---|---|---|
| `project-discovery` | Native commands, protected paths, conventions | Plan và solution |
| `change-definition` | Scope nghiệp vụ, non-goals, permissions | Specification |
| `solution-design` | Architecture và execution-policy design | Plan |
| `implementation-planning` | Task-level paths, commands, checks | Controller và hook |
| Controller | Phase, approval, authorization, terminal validity | Hook và skills |
| Hook | Không tạo policy | Enforce controller decision |
| `incremental-build` | Implementation và incremental evidence | Task contract |
| `change-verification` | Verification receipts | Definition of Done |
| Review skills | Findings có evidence | Remediation/final report |
| Definition of Done | Completion evidence contract | Stop/controller gate |

## Cách resume sau context compaction

1. Đọc `AGENTS.md` và repository instructions.
2. Đọc runbook này để xác định phase model.
3. Đọc `state.json` của change và chạy controller `check-resume`.
4. Đọc artifact đã được duyệt của phase hiện tại.
5. Kiểm tra Git baseline và unrelated changes.
6. Chỉ tiếp tục từ legal transition hoặc current task đã ghi.

Runbook này không thay thế state hoặc approval artifact. Nếu runbook và approved artifact khác nhau, approved artifact
và controller state có quyền ưu tiên; khác biệt material phải được người dùng xử lý rõ ràng.
