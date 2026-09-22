# Đánh giá cuối: Ổn định behavioral eval

## Kết quả

- Trạng thái cuối: `REVIEW PASSED`
- Change ID: `behavioral-eval-stabilization`
- Workflow profile/risk: `deep / high`
- Solution mode/approval: `full / User request CHAY het muc 1 den 5 di - 2026-09-21`
- Số chu kỳ review-khắc phục: 0

`REVIEW PASSED` áp dụng cho change thực hiện năm đầu việc và ghi baseline trung thực. Nó không có nghĩa full live suite là release gate xanh; full-run outcome vẫn là `45/48 PASS`.

## Phạm vi đã hoàn thành

- Sandbox preflight `read-only` và `workspace-write` PASS.
- Runner hỗ trợ `--kind` và repeatable `--case`.
- 9 execution case được chạy lại và đạt `9/9 PASS` trong batch riêng; không còn sandbox failure.
- Mismatch được triage theo `CASE_DEFECT`, `GRADER_DEFECT`, `SKILL_DEFECT`, `MODEL_VARIANCE`; không tìm thấy `SKILL_DEFECT` có bằng chứng ổn định.
- Targeted regression, deterministic gates và full 48-case suite đã chạy.
- Baseline, per-case CSV và mismatch triage được cập nhật.

## Các file đã thay đổi

- `evals/runners/run-behavioral-evals.mjs` - selective filters, token/model-call aggregation và run summary.
- `tests/unit/validate-plugin.test.mjs` - unit coverage cho selector, CLI và token aggregation.
- `evals/README.md` - cách dùng runner/filter hiện hành.
- `evals/cases/*.json` thuộc 11 skill - context contract, deterministic checks và evidence hardening.
- `tests/fixtures/verification-status/` - fixture verification portable.
- `.codex/docs/behavioral-eval-coverage-audit/` - coverage matrix, live baseline, case results và mismatch triage.
- `.codex/workflows/changes/behavioral-eval-stabilization/` - workflow state, tasks, evidence và báo cáo này.

Các thay đổi portable-plugin layout, skill source, manifest và runtime khác đã tồn tại trong dirty worktree từ change khác; change này không revert hay nhận ownership các phần đó.

## Acceptance criteria

| Criterion | Kết quả | Bằng chứng |
|---|---|---|
| AC-001 | satisfied | PREFLIGHT-001, PREFLIGHT-002 |
| AC-002 | satisfied | RUNNER-001, UNIT-001, DRYRUN-001 |
| AC-003 | satisfied | EXECUTION-001 |
| AC-004 | satisfied | TRIAGE-001, TARGETED-001 |
| AC-005 | satisfied | GATES-001, FULL-001, BASELINE-001 |

## Xác minh

| Bước kiểm tra | Trạng thái | Bằng chứng/giới hạn |
|---|---|---|
| Runner syntax | PASS | `node --check evals/runners/run-behavioral-evals.mjs` |
| Plugin validator | PASS | `node scripts/validators/validate-plugin.mjs` |
| Unit suite | PASS | `83/83` |
| Full dry-run | PASS | 48 case planned |
| Execution batch | PASS | `9/9` |
| Full live suite | FAIL as release gate | `45/48 PASS`; 3 semantic mismatches, 0 sandbox failure |
| Artifact integrity | PASS | CSV có 48 dòng; baseline và triage đọc được |
| Diff whitespace | PASS | `git diff --check`; chỉ có CRLF warnings |

## Review tuân thủ đặc tả

- `SPEC-REVIEW-001`: không có Critical/Important finding; AC-001 đến AC-005 đều satisfied.
- Không có extra behavior ngoài tooling/docs/test fixture cần cho baseline.

## Review kỹ thuật

- `ENG-REVIEW-001`: không có Critical/Important finding.
- `ENG-SUG-001`: nên tài liệu hóa rõ `latest-run-summary.json` luôn bị lần run gần nhất ghi đè, kể cả targeted run.

## Lịch sử khắc phục

Không có review-remediation cycle. Các case contract được harden trong BUILD trước VERIFY/REVIEW.

## Đề xuất và rủi ro còn lại

- Full live suite chưa phù hợp làm hard release gate vì model/grader variance; baseline cuối `45/48`, dù exact follow-up của ba failure đều PASS sau triage/hardening.
- Base API-equivalent cost khoảng `$9.59`; chưa áp per-call long-context multiplier và provider billing thực tế là `UNVERIFIED`.
- `ENG-SUG-001` không chặn acceptance và không được auto-fix trong review.
- Temp preflight directory ngoài repository có thể còn tồn tại vì outer policy từng chặn cleanup; không ảnh hưởng working tree.

## Learning retrospective

- Kết quả: `ALREADY COVERED`
- Candidate: không có
- Artifact: không tạo candidate artifact
- Plugin mutation: `none`
- Bằng chứng/lý do: evidence policy hiện đã cấm dùng focused/targeted PASS để khai full-suite PASS; change đã áp dụng đúng bằng cách giữ baseline `45/48`.
- Hành động của con người: không có.

## Blocker / Hành động cần con người thực hiện

- Không có blocker cho change này.
- Nếu muốn dùng live suite làm hard release gate, cần change riêng để thiết kế retry/quorum hoặc chuyển thêm semantic expectation sang deterministic checks.

## Tuyên bố dừng

Workflow dừng sau báo cáo này. Không có file nào được đưa vào staging hoặc commit; không thực hiện push, tạo pull request, merge, release, deploy, truy cập production hoặc thay đổi dữ liệu thật.
