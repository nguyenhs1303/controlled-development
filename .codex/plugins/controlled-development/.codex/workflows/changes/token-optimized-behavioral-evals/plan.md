# Ke hoach trien khai: Toi uu token cho behavioral eval

## Metadata

- Change ID: `token-optimized-behavioral-evals`
- Tham chieu phe duyet dac ta: `user-approved-full-scope-2026-09-19`
- Tham chieu phe duyet giai phap: `user-approved-full-scope-2026-09-19`
- Muc rui ro: `high`
- Bat buoc phe duyet ke hoach: `yes`

## Cach tiep can

Trien khai dung thu tu nguoi dung chon, moi increment co unit test va contract rieng: trace summary, deterministic pre-grading, selective context, sau cung impact selection.

## So do phu thuoc

```text
TASK-001 trace summary
  -> TASK-002 deterministic grading
  -> TASK-003 per-case context manifest
  -> TASK-004 impact selection
  -> TASK-005 validation and review
```

## Danh sach task

| Task | Acceptance criteria | Phu thuoc | File du kien | Xac minh |
|---|---|---|---|---|
| TASK-001 | AC-001 | None | runner, unit test | `node --test tests/unit/validate-plugin.test.mjs` |
| TASK-002 | AC-002 | TASK-001 | runner, case JSON, unit test | focused unit tests |
| TASK-003 | AC-003 | TASK-002 | all case JSON, validator, runner | validator + dry-run |
| TASK-004 | AC-004 | TASK-003 | runner, unit test, eval README | selector unit tests + CLI dry-run |
| TASK-005 | AC-005 | TASK-004 | evidence/final review | full unit suite + validator |

## Checkpoint

- Sau moi task chay focused test; sau TASK-004 chay toan bo deterministic gate.
- Khong chay model behavioral suite mac dinh vi muc tieu cua thay doi la toi uu token va deterministic coverage co the xac minh runner contract.

## Rui ro va bien phap giam thieu

| Rui ro | Tac dong | Bien phap |
|---|---|---|
| Parse JSONL phu thuoc shape | Mat command evidence | Parser tolerant, recursive extraction, fallback error summary, synthetic tests |
| Deterministic check false positive | Pass sai | Chi danh dau expectation deterministic khi check bao phu tron; fail closed khi check config sai |
| Context thieu | Executor hanh vi sai | Validator bat resource ton tai va skill chinh; unknown impact chay full suite |
| Dirty worktree | Ghi de thay doi nguoi dung | Chi sua file trong approved scope, khong revert |

## Rollback/Phuc hoi

Moi thay doi nam trong runner/case/test/docs va co the hoan tac theo tung task; workflow khong thuc hien Git destructive operation.

## Phe duyet ke hoach

- Quyet dinh: `APPROVED`
- Nguoi phe duyet: nguoi dung
- Tham chieu/thoi gian: user-approved-full-scope-2026-09-19
- Ghi chu: nguoi dung yeu cau chay den het de xuat 4 ma khong dung lai xin xac nhan.
