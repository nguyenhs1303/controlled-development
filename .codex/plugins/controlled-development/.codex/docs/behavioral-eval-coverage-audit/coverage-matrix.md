# Ma trận coverage behavioral eval

## Phạm vi audit

- Baseline trước audit: 45 behavioral case trên 11 skill.
- Baseline sau audit: 48 behavioral case.
- Nguồn contract: `skills/*/SKILL.md`, `references/policies/*.md`, workflow state/Definition of Done và 45 case ban đầu.
- Nguyên tắc: chỉ thêm case khi một hành vi có contract rõ, hậu quả đáng kể và chưa có scenario tương ứng.

## Requirement-to-case matrix

| Owner | Nhóm hành vi bắt buộc | Case bao phủ | Trạng thái |
|---|---|---|---|
| project-discovery | đọc instruction trước, tìm native commands/files, bảo toàn file ngoài scope | #1, #2 | Covered; execution rerun PASS |
| project-discovery | phân biệt fact với material unknown, hỏi thay vì suy diễn | #3 | Covered |
| change-definition | spec có criterion, preservation, non-goal, risk và verification intent | #1 | Covered |
| change-definition | yêu cầu mơ hồ và material decision chưa có evidence | #2, #4 | Covered |
| change-definition | spec write consent tách khỏi spec approval | #3 | Covered |
| solution-design | Standard/SOLUTION LITE và dùng extension point hiện hữu | #1 | Covered; execution rerun PASS |
| solution-design | quality target/performance unknown chặn recommendation | #2 | Covered |
| solution-design | không tích lũy pattern, dependency là quyết định permission-gated | #3 | Covered; execution rerun PASS |
| implementation-planning | task traceability, RED trước implementation, native commands | #1 | Covered về contract; live baseline bị evidence/environment ảnh hưởng |
| implementation-planning | plan approval optional theo sensitivity, không theo Medium mặc định | #2 | Covered |
| implementation-planning | Deep security/public API/persistence cần plan approval | #3 | Covered |
| implementation-planning | material architecture decision quay lại SOLUTION DESIGN | #4 | Covered |
| incremental-build | test-first, sửa tối thiểu, regression, giữ file ngoài scope/no commit | #1 | Covered; execution rerun PASS |
| incremental-build | không tự chọn observable API behavior khi còn ambiguity | #2 | Covered |
| change-verification | PASS/FAIL/NOT RUN/UNVERIFIED và không cài dependency | #1, #2 | Covered |
| change-verification | evidence sau edit bị stale và phải rerun check bị ảnh hưởng | #3 (mới) | Covered; live PASS |
| spec-compliance-review | incorrect/extra behavior | #1 | Covered |
| spec-compliance-review | missing behavior | #2 | Covered |
| spec-compliance-review | satisfied/clean review | #3 | Covered |
| spec-compliance-review | implemented but unverified | #4 (mới) | Covered; live PASS |
| engineering-review | Important vs Suggestion và remediation eligibility | #1 | Covered |
| engineering-review | concern không có trigger phải UNVERIFIED | #2 | Covered |
| engineering-review | clean review không bịa finding | #3 | Covered |
| engineering-review | security finding có trigger/path-traversal thật | #4 (mới) | Covered; live PASS |
| controlled-development | approval gates, absolute no-ship boundary, risk profile | #1, #5, #6 | Covered |
| controlled-development | invalid/valid resume, baseline/approval/controller ownership | #2, #7, #13 | Covered; execution rerun PASS sau fixture/prompt hardening |
| controlled-development | recovery/remediation cycle cap và blocked terminal states | #3, #4 | Covered |
| controlled-development | end-to-end remediation/reverify/rereview/retrospective | #8 | Covered; execution rerun PASS 7/7 |
| controlled-development | spec write consent và material compatibility unknown | #9, #10 | Covered |
| controlled-development | Standard solution-lite và solution drift khi planning | #11, #12 | Covered |
| learning-retrospective | candidate evidence/counterfactual/no mutation | #1 | Covered |
| learning-retrospective | domain-only lesson, blocked review, insufficient evidence | #2, #3, #4 | Covered |
| repository-bootstrap | explicit-only invocation, không tự bootstrap | #1, #2 | Covered |
| repository-bootstrap | same-task continuation vs new-task resume | #3, #4 | Covered |

## Policy coverage

| Policy | Behavioral coverage | Nhận định |
|---|---|---|
| decision-evidence | Nhiều case ambiguity/unknown ở discovery, define, solution, plan, build, review | Mạnh |
| permission | no install, no commit/push/deploy, dependency gate, scope preservation | Mạnh |
| evidence | status vocabulary, receipts, freshness, unsupported claims | Mạnh sau case mới |
| review | compliance taxonomy, severity, evidence threshold, security trigger, remediation eligibility | Mạnh sau 2 case mới |
| risk matrix | Quick/Standard/Deep và escalation | Mạnh |
| solution design | drivers, unknown quality target, pattern/dependency discipline | Mạnh |
| learning | candidate, domain exclusion, blocked skip, insufficient evidence | Khá; chưa có case riêng cho `ALREADY COVERED` và `NO DURABLE LEARNING` |
| output language | Policy được gửi cho mọi case nhưng chưa có expectation trực tiếp | Gap Medium |
| Definition of Done | terminal states, reviews, retrospective, no shipping | Mạnh |

## Gap ranking

### Đã xử lý trong audit

| Mức | Gap | Case mới |
|---|---|---|
| Important | Dùng PASS receipt cũ sau relevant edit | `change-verification#3` |
| Important | Engineering review chưa có security defect với trigger thật | `engineering-review#4` |
| Important | Spec review thiếu trạng thái `implemented but unverified` | `spec-compliance-review#4` |

### Còn lại

| Mức | Gap | Quyết định |
|---|---|---|
| Medium | Chưa kiểm tra trực tiếp output tiếng Việt và giữ nguyên enum/path | Chưa thêm; nên thiết kế detector tránh false-positive |
| Medium | Chưa có behavioral case riêng cho baseline drift/ledger tamper | Đã có deterministic unit coverage; chưa nhân đôi ngay |
| Medium | Chưa có engineering case về unbounded resource/performance trigger | Chưa thêm vì cần scenario thực tế đủ evidence |
| Low | Chưa có learning case riêng cho `ALREADY COVERED`/`NO DURABLE LEARNING` | Chưa thêm; bốn nhánh hiện tại bao phủ decision boundary chính |
| Low | Secret redaction chủ yếu được unit-test ở runner thay vì model behavior | Giữ deterministic coverage vì đáng tin cậy và rẻ hơn |

## Kết luận coverage

48 case hiện bao phủ các decision boundary quan trọng hơn 45 case ban đầu, nhưng chưa thể gọi là bao trọn tuyệt đối. Các gap còn lại đã được ghi rõ và không đủ căn cứ để tăng số case ngay trong audit này.

## Verification và review

- `node scripts/validators/validate-plugin.mjs`: `PASS`.
- `node --test tests/unit`: `PASS`, 83/83.
- `node evals/runners/run-behavioral-evals.mjs --all --dry-run`: `PASS`, 48 case planned.
- Full live suite hiện hành: chạy đủ 48 case, 45 PASS / 3 FAIL; process exit `1` đúng với kết quả có failure.
- Ba case mới đều PASS trong live suite.
- Specification-compliance review: năm đầu việc người dùng yêu cầu đều có artifact/evidence; chi phí thực tế của provider được ghi `UNVERIFIED`, kèm API-equivalent estimate thay vì giả định billing.
- Engineering review: không có Critical/Important finding trong ba case mới hoặc artifact audit; raw traces/gradings nằm ở `evals/results/` và bị Git ignore.
- Learning retrospective: `ALREADY COVERED` - live semantic variance đã nằm trong ranh giới evidence honesty; không đủ căn cứ tạo plugin candidate trong change này.
- Plugin mutation ngoài ba case regression: none.
