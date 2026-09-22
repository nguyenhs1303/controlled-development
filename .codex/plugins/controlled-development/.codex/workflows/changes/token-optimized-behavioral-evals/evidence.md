# Bang chung: Toi uu token cho behavioral eval

## EVID-001 - Runner syntax

- Trang thai: `PASS`
- Buoc kiem tra: `node --check evals/runners/run-behavioral-evals.mjs`
- Thu muc: plugin root
- Exit code: `0`
- Chung minh cho: AC-001, AC-002, AC-003, AC-004

## EVID-002 - Structural validator

- Trang thai: `PASS`
- Buoc kiem tra: `node scripts/validators/validate-plugin.mjs`
- Thu muc: plugin root
- Exit code: `0`
- Ket qua: `Controlled Development validation passed`
- Chung minh cho: AC-003, AC-005

## EVID-003 - Unit suite

- Trang thai: `PASS`
- Buoc kiem tra: `node --test tests/unit`
- Thu muc: plugin root
- Exit code: `0`
- Ket qua: `79 tests, 79 pass, 0 fail`
- Chung minh cho: AC-001 den AC-005

## EVID-004 - Full behavioral dry-run

- Trang thai: `PASS`
- Buoc kiem tra: `node evals/runners/run-behavioral-evals.mjs --all --dry-run`
- Thu muc: plugin root
- Exit code: `0`
- Ket qua: `45 behavioral evals planned; execution NOT RUN (dry-run)`
- Chung minh cho: AC-003, AC-005

## EVID-005 - Impact selection

- Trang thai: `PASS`
- Buoc kiem tra: cac lenh `--changed-file ... --dry-run` va `--changed --dry-run`
- Ket qua:
  - skill change chon skill case va dependent controlled cases;
  - policy change chon cac case khai bao policy;
  - `README.md` chon `0` case;
  - shared schema chon `45` case;
  - working tree hien tai co shared changes nen `--changed` chon `45` case.
- Chung minh cho: AC-004

## EVID-006 - Whitespace/scope check

- Trang thai: `PASS`
- Buoc kiem tra: `git diff --check` va scoped `git status --short`
- Ket qua: khong co whitespace error; cac fixture/reference/script deletion ngoai scope da ton tai trong dot tai cau truc truoc thay doi nay va khong bi hoan tac.
- Chung minh cho: bao toan working tree

## EVID-007 - Remediation cycle 1

- Trang thai: `PASS`
- Finding: `ENG-001` - raw trace artifact chua duoc ignore, co the lam working tree bi ban sau mot eval that bai.
- Thay doi: them `*.trace.jsonl` vao `evals/results/.gitignore` va unit test bao ve contract.
- Cac diem cung duoc chot trong cung vong:
  - `solution-design#2` khai bao `assets/workflow-templates/solution.md`;
  - `final_message_matches` duoc validate regex truoc execution;
  - raw trace duoc luu khi executor hoac grader phat sinh loi.
- Chung minh cho: AC-001, AC-003 va tinh chan doan an toan.

## EVID-008 - Re-verification sau remediation

- Trang thai: `PASS`
- Thu muc: plugin root
- Ket qua:
  - `node --check evals/runners/run-behavioral-evals.mjs`: exit `0`;
  - `node --test tests/unit`: exit `0`, `79 tests, 79 pass, 0 fail`;
  - `node scripts/validators/validate-plugin.mjs`: exit `0`;
  - `node evals/runners/run-behavioral-evals.mjs --all --dry-run`: exit `0`, `45 behavioral evals planned`;
  - README-only impact: `0 behavioral evals planned`;
  - shared schema impact: `45 behavioral evals planned`;
  - `git diff --check`: exit `0`, chi co canh bao line ending.
- Chung minh cho: AC-001 den AC-005 va ENG-001.

## EVID-009 - Re-review

- Review tuan thu dac ta: khong co finding Critical/Important; AC-001 den AC-005 deu `satisfied`.
- Review ky thuat: khong co finding Critical/Important sau remediation.
- Suggestion: khong co.
- Gioi han: live behavioral model suite `NOT RUN` theo ke hoach da duyet de khong tieu ton token; contract runner duoc bao phu boi unit test, validator va dry-run.

## Ma tran acceptance criterion

| Criterion | Bang chung trien khai | Bien nhan | Trang thai |
|---|---|---|---|
| AC-001 | trace summary, raw trace writer, semantic grader prompt | EVID-001, EVID-003, EVID-007, EVID-008 | `PASS` |
| AC-002 | deterministic rules, fail-fast, semantic subset merge | EVID-003, EVID-008 | `PASS` |
| AC-003 | `context_files` tren 45 case va validator | EVID-002, EVID-004, EVID-007, EVID-008 | `PASS` |
| AC-004 | dependency-based selector va CLI | EVID-003, EVID-005, EVID-008 | `PASS` |
| AC-005 | legacy skill/full selection va 45-case dry-run | EVID-002, EVID-004, EVID-008 | `PASS` |

