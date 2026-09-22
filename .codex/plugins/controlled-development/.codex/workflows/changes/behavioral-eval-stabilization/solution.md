# Thiet ke giai phap: On dinh behavioral eval

## Metadata

- Change ID: `behavioral-eval-stabilization`
- Che do: `FULL SOLUTION`
- Tham chieu dac ta: `User request CHAY het muc 1 den 5 di - 2026-09-21`
- Phien ban: `v1`

## Boi canh quyet dinh

Baseline 48 case bi tron lan giua loi sandbox cu, case/expectation khong kha thi trong dialogue mode, grader mismatch va model variance. Runner chua the chon theo kind hoac mot case cu the, nen moi lan dieu tra co the goi model khong can thiet.

## Decision drivers

| Driver | Muc | Nguon |
|---|---|---|
| Chi chay dung tap case can dieu tra | `MUST` | AC-002, chi phi baseline |
| Bao toan mode `--all`, skill, `--changed`, `--changed-file` | `MUST` | AC-002 |
| Khong bien environment failure thanh product failure | `MUST` | AC-001, AC-003 |
| Case dialogue phai kha thi trong rang buoc khong command/khong write | `MUST` | AC-004, runner mode instruction |
| Full suite chi chay sau targeted stabilization | `MUST` | AC-005 |
| Khong them dependency | `SHOULD` | Permission boundary |

## Quality scenarios

| Thuoc tinh | Scenario | Bang chung |
|---|---|---|
| Cost | `--kind execution` chon dung 9/48 case; `--case` chon dung 1 case | Unit test va dry-run |
| Compatibility | Lua chon cu cho ket qua nhu truoc khi khong dung filter moi | Unit test/CLI dry-run |
| Diagnosability | Ket qua targeted co grading/trace giong full runner | Live targeted run |
| Reliability | Filter sai bi tu choi truoc model call | Unit test parser/selection |

## Cac option

### Option 1: Filter trong runner sau khi nap va validate case

- Them `--kind` va `--case`, sau do loc danh sach evaluation da validate.
- Uu diem: tai su dung load/validation/execution path, khong duplicate logic, khong dependency.
- Nhuoc diem: can quy tac ro ve ket hop filter va impact selection.
- Confidence: `EVIDENCED` boi cau truc runner hien tai.

### Option 2: Script wrapper rieng de sua JSON/tap file tam

- Uu diem: it sua runner.
- Nhuoc diem: hai nguon CLI contract, de lech validation/result path, kho unit test.
- Ket qua: `FAIL` voi maintainability va diagnosability.

## Khuyen nghi

- Chon Option 1.
- Cho phep `--kind` va `--case` ket hop voi `--all`, skill selection va impact selection; tat ca filter la giao nhau.
- `--case` dung dinh dang `<skill>:<positive-integer>` va co the lap lai.
- Neu filter hop le nhung khong match, runner bao `0 behavioral evals selected` va khong goi model.
- Triage case theo evidence: case/prompt/mode contradiction sua case; deterministic pattern sai sua grader contract; skill chi sua khi contract thuc su thieu; model variance giu nguyen case va ghi nhan.

## Kien truc

```text
load + validate all selected definitions
              |
 impact selection (optional)
              |
 kind/case filters
              |
 dry-run or existing executor/grader pipeline
```

- Khong pattern, dependency hoac technology moi.
- Khong thay doi result filename/grading schema.

## Verification conditions

| Claim | Cach xac minh | Ket qua |
|---|---|---|
| Filter dung | Unit + dry-run | 9 execution, 39 dialogue, 1 exact case |
| Compatibility | Unit + full dry-run | 48 case, mode cu van hoat dong |
| Sandbox hoat dong | Hai preflight | Exit 0 va observable command/file |
| Triage co can cu | Targeted rerun + artifact | Moi failure co mot category |
| Baseline moi | Full live suite | 48 ket qua va token/call totals |

## Revisit conditions

- CLI case ID thay doi khong con duy nhat theo skill.
- Runner can shard/parallel execution hoac resume giua suite.
- Live provider khong cung cap usage metadata de lap baseline.

## Cau hoi con mo

- Khong co.

## Phe duyet

- Quyet dinh: `APPROVED`
- Tham chieu: `CHAY het muc 1 den 5 di`, 2026-09-21
