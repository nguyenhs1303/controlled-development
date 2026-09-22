# Bang chung: On dinh behavioral eval

## PREFLIGHT-001 - Read-only sandbox

- Trang thai: `PASS`
- Lenh: Codex CLI `exec --sandbox read-only` chay `Get-Location` trong plugin root.
- Ket qua: command exit `0`; final message `READ_ONLY_SANDBOX_OK`.
- Thoi diem: 2026-09-21.
- Chung minh cho: AC-001.

## PREFLIGHT-002 - Workspace-write sandbox

- Trang thai: `PASS`
- Lenh: Codex CLI `exec --sandbox workspace-write` tao va doc `sandbox-marker.txt` trong temp workspace.
- Ket qua: command exit `0`; marker ton tai voi noi dung `SANDBOX_OK`; final message `WORKSPACE_WRITE_SANDBOX_OK`.
- Thoi diem: 2026-09-21.
- Chung minh cho: AC-001.

## Gioi han preflight

- CLI ghi canh bao OAuth cho Postman va plugin catalog, nhung shell command va workspace mutation van thanh cong.
- Thu muc temp cleanup bi outer command policy chan; artifact nam ngoai repository va khong anh huong working tree.

## RUNNER-001 - Selective runner

- Trang thai: `PASS`.
- Runner ho tro `--kind dialogue|execution` va repeatable `--case <skill>:<id>`.
- Bo loc giao nhau voi selector cu va impact selection; CLI docs duoc cap nhat.
- Runner ghi token/model-call summary tu Codex JSONL.
- Chung minh cho: AC-002, AC-005.

## UNIT-001 - Unit suite

- Trang thai: `PASS`.
- Lenh: `node --test tests/unit`.
- Ket qua hien hanh: `83/83 PASS`.
- Chung minh cho: AC-002, AC-005.

## DRYRUN-001 - Selection checks

- Trang thai: `PASS`.
- Full dry-run: 48 case.
- Execution dry-run: 9 case.
- Exact-case dry-run: 1 case.
- Chung minh cho: AC-002.

## EXECUTION-001 - Live execution rerun

- Trang thai: `PASS`.
- Lenh: `node evals/runners/run-behavioral-evals.mjs --all --kind execution`.
- Ket qua: `9/9 PASS`; `0/9` sandbox/helper failure.
- Chung minh cho: AC-003.

## TRIAGE-001 - Mismatch classification

- Trang thai: `PASS`.
- Artifact: `.codex/docs/behavioral-eval-coverage-audit/mismatch-triage.md`.
- Ket luan: da sua `CASE_DEFECT` va mot `GRADER_DEFECT`; khong co `SKILL_DEFECT` duoc chung minh; residual semantic failures duoc ghi `MODEL_VARIANCE`.
- Fixture portable moi: `tests/fixtures/verification-status/`.
- Chung minh cho: AC-004.

## TARGETED-001 - Stability confirmation

- Trang thai: `PASS`.
- Batch cac case tung dao dong dat `4/4 PASS`.
- Cac case duoc harden sau full run co hai exact PASS lien tiep.
- Chung minh cho: AC-004, AC-005.

## GATES-001 - Deterministic gates

- Trang thai: `PASS`.
- `node --check evals/runners/run-behavioral-evals.mjs`: PASS.
- `node scripts/validators/validate-plugin.mjs`: PASS.
- `node --test tests/unit`: PASS, 83/83.
- Full dry-run: PASS, 48 case.
- `git diff --check`: PASS; chi co line-ending warnings.
- Chung minh cho: AC-005.

## FULL-001 - Full live suite

- Trang thai: `FAIL` theo hard-gate semantics; baseline da thu day du.
- Lenh: `node evals/runners/run-behavioral-evals.mjs --all`.
- Ket qua: `45/48 PASS`, `3/48 FAIL`; 95 model calls.
- Token: input 5,951,600; cached 4,442,368; output 88,685; reasoning output 35,671.
- Khong co sandbox/helper failure.
- Hai failure PASS ngay khi exact rerun; mot failure la case observability defect da harden va PASS hai lan.
- Chung minh cho: AC-005; release gate van chua xanh vi model variance.

## BASELINE-001 - Audit artifacts

- Trang thai: `PASS`.
- `.codex/docs/behavioral-eval-coverage-audit/live-baseline.md` da cap nhat.
- `.codex/docs/behavioral-eval-coverage-audit/case-results.csv` da cap nhat.
- `.codex/docs/behavioral-eval-coverage-audit/mismatch-triage.md` da tao.
- Chung minh cho: AC-004, AC-005.

## Git baseline drift reconciliation

- `check-resume` bao drift sau khi BUILD da sua runner/cases/tests/docs dung approved scope.
- Ledger va schema van aligned/valid; approved spec/solution/plan digests khong doi.
- Khong co reset, revert, stage, commit, push hoac shipping operation.

## SPEC-REVIEW-001 - Specification compliance

- Trang thai: `PASS`.
- AC-001: satisfied boi PREFLIGHT-001/PREFLIGHT-002.
- AC-002: satisfied boi RUNNER-001/UNIT-001/DRYRUN-001.
- AC-003: satisfied boi EXECUTION-001.
- AC-004: satisfied boi TRIAGE-001/TARGETED-001.
- AC-005: satisfied boi GATES-001/FULL-001/BASELINE-001.
- Full suite duoc yeu cau chay va ghi baseline trung thuc; spec khong yeu cau 48/48 PASS.
- Khong co missing, incorrect, extra hoac implemented-but-unverified criterion.

## ENG-REVIEW-001 - Engineering review

- Trang thai: `PASS` voi mot Suggestion khong chan.
- Correctness/security: selector validation, safe path resolution, snapshot limits va secret redaction van duoc giu; khong co Critical/Important finding.
- Tests/evidence: unit 83/83, validator, dry-run, execution rerun va full run co receipt hien hanh.
- Suggestion `ENG-SUG-001`: tai lieu hoa rang `evals/results/latest-run-summary.json` luon phan anh lan run gan nhat va co the bi targeted run ghi de sau full run.
- Remediation eligibility: `not applicable`; Suggestion khong duoc auto-fix trong review.

## LEARNING-001 - Retrospective

- Classification: `ALREADY COVERED`.
- Observation: full-run semantic failures co the PASS ngay khi exact rerun; targeted PASS khong duoc dung de khai full-suite PASS.
- Existing coverage: evidence policy da cam dung focused evidence de khai broad/full pass va yeu cau ghi dung pham vi receipt.
- Durability counterfactual: neu retrospective bien mat, agent van phai bao cao full run `45/48` va targeted confirmation rieng theo policy hien hanh.
- Candidate: none.
- Plugin mutation: none trong retrospective.
