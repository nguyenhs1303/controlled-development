# Danh sách task: Plugin Hook Enforcement

## Quy tắc chung

- Mỗi task bắt đầu bằng test RED hoặc ghi `NOT APPLICABLE` có lý do, sau đó GREEN và regression được chỉ định.
- Chỉ sửa file liệt kê; file mới phải nằm trong `Allowed new files`.
- Không thêm dependency, stage/commit/push/PR/release/deploy hoặc tự revert user work.
- Tất cả path dưới đây tương đối với `.codex/plugins/controlled-development/`, trừ artifact workflow hiện tại.

## TASK-001: Hook package contract

- Trạng thái: `TODO`
- Phụ thuộc: None
- Acceptance criteria: AC-010
- Allowed files: `plugin.json`, `.codex-plugin/plugin.json`, `scripts/validators/validate-plugin.mjs`,
  `tests/unit/validate-plugin.test.mjs`
- Allowed new files: `hooks/hooks.json`, `hooks/run-hook.mjs`
- Mô tả: cho phép và validate plugin-bundled hooks, hai manifest đồng bộ, Windows/Unix commands hợp lệ.
- RED: validator test chứng minh manifest hooks hiện bị reject/missing contract.
- GREEN: `node --test tests/unit/validate-plugin.test.mjs --test-name-pattern="hook"`
- Regression: `node scripts/validators/validate-plugin.mjs`
- Permission: local package/config only; không install plugin.

## TASK-002: Hook event fixtures và shared harness

- Trạng thái: `TODO`
- Phụ thuộc: TASK-001
- Acceptance criteria: AC-012
- Allowed files: `tests/unit/hook-runtime.test.mjs`
- Allowed new files: `tests/helpers/hook-harness.mjs`, `tests/fixtures/hooks/session-start.json`,
  `tests/fixtures/hooks/pre-tool-use.json`, `tests/fixtures/hooks/post-tool-use.json`,
  `tests/fixtures/hooks/stop.json`
- Mô tả: tạo harness gọi hook bằng JSON stdin và parse JSON/exit code deterministically.
- RED: harness test fail vì runtime chưa có decision implementation.
- GREEN: `node --test tests/unit/hook-runtime.test.mjs --test-name-pattern="fixture|harness"`
- Regression: package validator.

## TASK-003: Schema v4 và execution-policy contract

- Trạng thái: `TODO`
- Phụ thuộc: TASK-002
- Acceptance criteria: AC-002, AC-009
- Allowed files: `assets/workflow-templates/state.json`, `references/schemas/workflow-state-schema.md`,
  `scripts/runtime/validate-workflow-state.mjs`, `tests/unit/validate-plugin.test.mjs`
- Allowed new files: `assets/workflow-templates/execution-policy.json`,
  `tests/fixtures/workflow-state/enforcement-valid-state.json`,
  `tests/fixtures/workflow-state/enforcement-invalid-state.json`
- Mô tả: schema mới cho active binding, task contract, policy digest, readiness, violation và evidence freshness;
  schema 1/2/3 không auto-migrate.
- RED: fixtures schema v4 fail validation trước implementation.
- GREEN: targeted schema tests trong `validate-plugin.test.mjs`.
- Regression: full `validate-plugin.test.mjs`.

## TASK-004: Controller authorization engine và rule IDs

- Trạng thái: `TODO`
- Phụ thuộc: TASK-003
- Acceptance criteria: AC-002
- Allowed files: `scripts/runtime/workflow-controller-core.mjs`, `scripts/runtime/workflow-controller.mjs`,
  `tests/unit/workflow-controller.test.mjs`
- Allowed new files: `scripts/runtime/enforcement-rule-ids.mjs`, `scripts/runtime/execution-policy.mjs`,
  `tests/unit/execution-policy.test.mjs`
- Mô tả: central decision envelope `{allowed, ruleId, reason, audit}` và controller APIs; adapters không chứa rules.
- RED: authorization tests fail vì API/rule IDs chưa tồn tại.
- GREEN: `node --test tests/unit/execution-policy.test.mjs tests/unit/workflow-controller.test.mjs`
- Regression: workflow rules tests.

## TASK-005: Active-change lifecycle và hook readiness proof

- Trạng thái: `TODO`
- Phụ thuộc: TASK-004
- Acceptance criteria: AC-001, AC-003, AC-009
- Allowed files: `scripts/runtime/workflow-controller-core.mjs`, `scripts/runtime/workflow-controller.mjs`,
  `scripts/runtime/workflow-state-store.mjs`, `tests/unit/workflow-controller.test.mjs`
- Allowed new files: `scripts/runtime/active-change-store.mjs`, `tests/unit/active-change-store.test.mjs`
- Mô tả: atomic one-active-change binding per checkout, activate/deactivate/status, policy nonce và local readiness proof.
- RED: lifecycle tests cho ambiguity, stale binding và missing proof fail.
- GREEN: controller/active-store tests.
- Regression: state/controller suites.

## TASK-006: SessionStart adapter và inactive no-op

- Trạng thái: `TODO`
- Phụ thuộc: TASK-005
- Acceptance criteria: AC-001, AC-003, AC-010
- Allowed files: `hooks/run-hook.mjs`, `tests/unit/hook-runtime.test.mjs`
- Allowed new files: `scripts/runtime/hook-runtime.mjs`, `scripts/runtime/hook-event-parser.mjs`
- Mô tả: parse common input, resolve checkout/active state, record readiness proof, add concise context, no-op inactive.
- RED: SessionStart/inactive/malformed fixtures fail.
- GREEN: targeted hook runtime tests.
- Regression: package validator + controller tests.

## TASK-007: PreToolUse file/path enforcement

- Trạng thái: `TODO`
- Phụ thuộc: TASK-006
- Acceptance criteria: AC-004
- Allowed files: `scripts/runtime/hook-runtime.mjs`, `scripts/runtime/execution-policy.mjs`,
  `tests/unit/hook-runtime.test.mjs`
- Allowed new files: `scripts/runtime/path-policy.mjs`, `tests/unit/path-policy.test.mjs`
- Mô tả: extract apply_patch/file-tool targets; normalize Windows/Unix paths; protect controller files; enforce write/new-file lists.
- RED: allow/deny/traversal/symlink tests fail.
- GREEN: path-policy + hook focused tests.
- Regression: controller tests.

## TASK-008: PreToolUse command enforcement

- Trạng thái: `TODO`
- Phụ thuộc: TASK-007
- Acceptance criteria: AC-005
- Allowed files: `scripts/runtime/hook-runtime.mjs`, `scripts/runtime/execution-policy.mjs`,
  `tests/unit/hook-runtime.test.mjs`
- Allowed new files: `scripts/runtime/command-policy.mjs`, `tests/unit/command-policy.test.mjs`
- Mô tả: conservative Windows/Unix classification; compound/unknown commands deny; exact grants và read-only classes.
- RED: command allow/deny/compound/platform tests fail.
- GREEN: command-policy + hook focused tests.
- Regression: package/controller suites.

## TASK-009: PostToolUse side-effect audit và dirty baseline

- Trạng thái: `TODO`
- Phụ thuộc: TASK-008
- Acceptance criteria: AC-006
- Allowed files: `scripts/runtime/hook-runtime.mjs`, `scripts/runtime/workflow-controller-core.mjs`,
  `tests/unit/hook-runtime.test.mjs`, `tests/unit/workflow-controller.test.mjs`
- Allowed new files: `scripts/runtime/worktree-snapshot.mjs`, `tests/unit/worktree-snapshot.test.mjs`
- Mô tả: pre/post snapshot, exclude controller artifacts, preserve pre-existing dirty file digests, record violations, no revert.
- RED: dirty-file and out-of-scope side-effect tests fail.
- GREEN: snapshot/PostToolUse tests.
- Regression: controller/state suites.

## TASK-010: Diff-bound evidence freshness

- Trạng thái: `TODO`
- Phụ thuộc: TASK-009
- Acceptance criteria: AC-007
- Allowed files: `scripts/runtime/workflow-controller-core.mjs`, `scripts/runtime/workflow-crypto.mjs`,
  `scripts/runtime/validate-workflow-state.mjs`, `tests/unit/workflow-controller.test.mjs`,
  `tests/unit/validate-plugin.test.mjs`
- Allowed new files: none
- Mô tả: implementation snapshot/digest, receipt binding, stale transition và resume validation không tự tham chiếu artifact root.
- RED: changed-diff-after-receipt tests fail.
- GREEN: controller/state focused tests.
- Regression: all unit tests hiện có.

## TASK-011: Stop terminal validation và loop prevention

- Trạng thái: `TODO`
- Phụ thuộc: TASK-010
- Acceptance criteria: AC-008
- Allowed files: `scripts/runtime/hook-runtime.mjs`, `scripts/runtime/workflow-controller-core.mjs`,
  `tests/unit/hook-runtime.test.mjs`, `tests/unit/workflow-controller.test.mjs`
- Allowed new files: none
- Mô tả: approval wait/blocker stop hợp lệ; incomplete task/invalid terminal tiếp tục một lần; `stop_hook_active` fail-safe.
- RED: approval-wait, terminal-claim và second-stop tests fail.
- GREEN: Stop focused tests.
- Regression: controller/hook suites.

## TASK-012: Permission, evidence, review và Definition of Done policies

- Trạng thái: `TODO`
- Phụ thuộc: TASK-011
- Acceptance criteria: AC-007, AC-009, AC-011
- Allowed files: `references/policies/permission-policy.md`, `references/policies/evidence-policy.md`,
  `references/policies/review-policy.md`, `references/policies/definition-of-done.md`,
  `references/schemas/workflow-state-schema.md`
- Allowed new files: none
- Mô tả: document controller/hook boundary, trust status, stale receipt, protected paths, rule IDs và terminal contract.
- RED: package contract/link tests được thêm trước policy changes trong existing validator test.
- GREEN: package validator + targeted unit assertions.
- Regression: trigger eval.

## TASK-013: Controlled-development orchestrator integration

- Trạng thái: `TODO`
- Phụ thuộc: TASK-012
- Acceptance criteria: AC-011
- Allowed files: `skills/controlled-development/SKILL.md`, `evals/cases/controlled-development.json`
- Allowed new files: none
- Mô tả: active lifecycle, readiness gate, controller authorization, bootstrap exception và terminal marker flow.
- RED: targeted behavioral/deterministic expectation fail.
- GREEN: `node evals/runners/run-behavioral-evals.mjs controlled-development --dry-run` + deterministic checks.
- Regression: package validator + trigger eval.

## TASK-014: Discovery và planning execution-policy producers

- Trạng thái: `TODO`
- Phụ thuộc: TASK-013
- Acceptance criteria: AC-002, AC-004, AC-005, AC-011
- Allowed files: `skills/project-discovery/SKILL.md`, `skills/implementation-planning/SKILL.md`,
  `evals/cases/project-discovery.json`, `evals/cases/implementation-planning.json`,
  `assets/workflow-templates/plan.md`, `assets/workflow-templates/tasks.md`
- Allowed new files: none
- Mô tả: discovery phân loại commands/protected paths; plan tạo allowed paths/new files/checks/grants per task.
- RED: targeted eval expectation fail.
- GREEN: targeted behavioral dry-run/deterministic validation.
- Regression: validator + trigger eval.

## TASK-015: BUILD và VERIFY execution-policy consumers

- Trạng thái: `TODO`
- Phụ thuộc: TASK-014
- Acceptance criteria: AC-004, AC-005, AC-006, AC-007, AC-011
- Allowed files: `skills/incremental-build/SKILL.md`, `skills/change-verification/SKILL.md`,
  `evals/cases/incremental-build.json`, `evals/cases/change-verification.json`,
  `assets/workflow-templates/evidence.md`
- Allowed new files: none
- Mô tả: task claim activates exact contract; verification receipts bind current diff; violation/stale recovery rõ ràng.
- RED: targeted eval expectations fail.
- GREEN: targeted eval dry-run/deterministic tests.
- Regression: validator + trigger eval.

## TASK-016: Review và terminal consumers

- Trạng thái: `TODO`
- Phụ thuộc: TASK-015
- Acceptance criteria: AC-007, AC-008, AC-011
- Allowed files: `skills/spec-compliance-review/SKILL.md`, `skills/engineering-review/SKILL.md`,
  `evals/cases/spec-compliance-review.json`, `evals/cases/engineering-review.json`,
  `references/policies/definition-of-done.md`, `assets/workflow-templates/final-review.md`
- Allowed new files: none
- Mô tả: review kiểm tra enforcement evidence/current diff và terminal authorization trước final claim.
- RED: targeted eval expectations fail.
- GREEN: targeted eval dry-run/deterministic tests.
- Regression: validator + trigger eval.

## TASK-017: README, package structure và local trust guidance

- Trạng thái: `TODO`
- Phụ thuộc: TASK-016
- Acceptance criteria: AC-010, AC-013
- Allowed files: `README.md`, `evals/README.md`, `scripts/validators/validate-plugin.mjs`,
  `tests/unit/validate-plugin.test.mjs`
- Allowed new files: none
- Mô tả: document hooks package, install/cachebuster/reinstall, `/hooks` review/trust, disabled behavior và honest live status.
- RED: required documentation markers fail validator test.
- GREEN: package validator.
- Regression: full unit suite.

## TASK-018: Behavioral eval và regression coverage

- Trạng thái: `TODO`
- Phụ thuộc: TASK-017
- Acceptance criteria: AC-012
- Allowed files: `evals/cases/controlled-development.json`, `evals/cases/project-discovery.json`,
  `evals/cases/implementation-planning.json`, `evals/cases/incremental-build.json`,
  `evals/cases/change-verification.json`, `evals/cases/spec-compliance-review.json`,
  `evals/cases/engineering-review.json`, `evals/runners/run-behavioral-evals.mjs`,
  `tests/unit/validate-plugin.test.mjs`
- Allowed new files: hook-focused eval fixture files dưới `tests/fixtures/hook-enforcement/`
- Mô tả: cover inactive, deny, stale, trust, bypass và recovery paths; update impact mapping fail-closed.
- RED: new deterministic expectations fail.
- GREEN: targeted evals + `--all --dry-run`.
- Regression: trigger eval + full unit suite.

## TASK-019: Full verification và live integration

- Trạng thái: `TODO`
- Phụ thuộc: TASK-018
- Acceptance criteria: AC-001..AC-013
- Allowed files: workflow `evidence.md`, `tasks.md`, controller-owned state/event metadata; source chỉ khi bounded recovery hoặc approved remediation cần thiết.
- Allowed new files: local temp/fixture output dưới ignored eval result paths; không thêm source ngoài task trước.
- Mô tả: chạy package validator, trigger eval, full unit suite, behavioral dry-run, selected behavioral eval và live test nếu được phép.
- RED: `NOT APPLICABLE` - verification task không thêm behavior mới.
- GREEN/regression: toàn bộ native commands và criterion matrix.
- Permission: hỏi ngay trước install/reinstall/trust plugin user-scope; nếu không được phép ghi non-pass trung thực.

## Bằng chứng

- Biên nhận: cập nhật theo từng task trong `evidence.md`.
- File đã thay đổi: cập nhật sau mỗi increment.
- Blocker: tối đa ba recovery attempts khác hypothesis cho cùng blocker.
