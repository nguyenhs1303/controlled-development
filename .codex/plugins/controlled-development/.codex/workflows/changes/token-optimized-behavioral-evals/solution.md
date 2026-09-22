# Thiet ke giai phap: Toi uu token cho behavioral eval

## Metadata

- Change ID: `token-optimized-behavioral-evals`
- Che do: `FULL SOLUTION`
- Tham chieu dac ta da duyet: `user-approved-full-scope-2026-09-19`
- Phien ban giai phap: `v1`

## Boi canh quyet dinh

Runner hien tai nap gan nhu toan bo skill/reference/template cho executor va gui raw JSONL trace toi model grader cho moi case. Moi case deu dung model grader va CLI chi ho tro mot skill hoac full suite.

## Decision drivers

| Driver | Muc bat buoc | Bang chung/nguon |
|---|---|---|
| Giam input token executor | `MUST` | AC-003 |
| Giam input token va so lan goi grader | `MUST` | AC-001, AC-002 |
| Khong giam 45 behavioral case | `MUST` | AC-005 |
| Raw evidence van dieu tra duoc | `MUST` | AC-001 |
| Impact selection fail closed | `MUST` | AC-004 |
| Khong them dependency | `SHOULD` | Node standard library da du |

## Quality scenarios

| Thuoc tinh | Scenario | Trang thai |
|---|---|---|
| Token efficiency | Executor chi nhan `context_files`; grader khong nhan raw trace; deterministic-only case khong goi grader | `EVIDENCED` boi prompt construction va unit test |
| Reliability | Resource path/fixture/check sai bi validator va dry-run tu choi | `EVIDENCED` boi structural validator |
| Diagnosability | Moi execution luu raw `.trace.jsonl`; grading luu nguon ket qua | `EVIDENCED` boi result writer |
| Selection safety | Shared/unknown impact chay full suite; docs-only co the chay zero | `EVIDENCED` boi selector tests |

## Cac giai phap duoc xem xet

### Option 1: Contract khai bao trong tung eval va mot runner hop nhat

- Moi eval khai bao `context_files` va optional `deterministic_checks`.
- Runner doc dung cac resource do, tom tat JSONL trace, chay check truoc grader, va dung cung dependency cho `--changed`.
- Uu diem: mot nguon chan ly, fail closed, khong dependency moi, test duoc bang ham thuan.
- Nhuoc diem: case JSON dai hon va can bao tri mapping.
- Confidence: `EVIDENCED`.

### Option 2: Heuristic tu suy ra context/check/impact

- Runner suy ra tu ten skill va expectation text.
- Uu diem: case JSON ngan.
- Nhuoc diem: dependency an, de nap thua/bo sot, impact selection khong audit duoc.
- Ket qua: `FAIL` voi driver khai bao ro va fail closed.

## Giai phap khuyen nghi

- Chon Option 1.
- `context_files` la dependency manifest cap eval.
- `deterministic_checks` bao phu tron mot expectation; expectation khong co check moi duoc gui model grader.
- Neu deterministic check fail, case fail-fast va model grader khong duoc goi.
- Trace summary duoc tao co hoc tu JSONL va snapshot diff; raw trace chi ghi ra disk.
- `--changed <path>` co the lap lai. Shared runner/validator/case-schema path chon full suite; README-only chon zero; path khong biet chon full suite.

## Kien truc duoc de xuat

```text
case JSON
  |-- context_files ------> executor prompt
  |-- deterministic_checks -> pre-grader
  |-- files --------------> isolated workspace

executor JSONL -> raw trace file
              -> mechanical summary -> semantic-only grader

changed paths -> context/fixture/case dependency match -> selected evals
```

- Khong can pattern, cong nghe hoac dependency moi.
- Logic moi tach thanh ham thuan export duoc de unit test.

## Verification conditions

| Claim | Cach xac minh | Ket qua can quan sat |
|---|---|---|
| Raw trace khong vao grader | Unit test prompt/evidence summary | Khong co marker raw trace/output khong lien quan |
| Deterministic pre-grade | Unit test pass/fail/partial | Grader chi nhan expectation semantic; deterministic-only khong can grader |
| Context toi thieu | Validator va dry-run | Moi eval co resource hop le, bundle chi co file da khai bao |
| Impact selection | Unit test selector | Skill/policy/shared/README/unknown dung rule |
| Regression | Full Node unit suite + validator | Exit 0 |

## Revisit conditions

- Codex JSONL thay doi khong con nhan dien duoc command/exit code.
- Case can deterministic rule moi khong the bieu dien an toan.
- Context chung thay doi qua thuong xuyen khien manifest bi lech.

## Phe duyet giai phap

- Quyet dinh: `APPROVED`
- Nguoi phe duyet: nguoi dung
- Tham chieu/thoi gian: user-approved-full-scope-2026-09-19
- Ghi chu: giai phap bam dung thu tu 3, 2, 1, 4 va khong them dependency.
