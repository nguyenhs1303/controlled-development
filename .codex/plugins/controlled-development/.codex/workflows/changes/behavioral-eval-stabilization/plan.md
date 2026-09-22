# Ke hoach trien khai: On dinh behavioral eval

## Metadata

- Change ID: `behavioral-eval-stabilization`
- Spec approval: `User request CHAY het muc 1 den 5 di - 2026-09-21`
- Solution approval: cung tham chieu
- Muc rui ro: `high`
- Bat buoc phe duyet plan: `yes`

## Cach tiep can

Thuc hien dung thu tu nam buoc da phe duyet, dung targeted checks de giam chi phi va chi chay full suite khi sandbox/filter/case stabilization da co bang chung.

## Truy vet

| Task | Solution | Criterion |
|---|---|---|
| TASK-001 | Sandbox preflight | AC-001 |
| TASK-002 | Runner filters | AC-002 |
| TASK-003 | Targeted execution rerun | AC-003 |
| TASK-004 | Dialogue mismatch triage/remediation | AC-004 |
| TASK-005 | Regression va full baseline | AC-005 |

## Phu thuoc

```text
TASK-001 -> TASK-002 -> TASK-003 -> TASK-004 -> TASK-005
```

## Danh sach task

| Task | File du kien | Xac minh |
|---|---|---|
| TASK-001 | evidence artifact | Codex read-only/workspace-write smoke tests |
| TASK-002 | runner, unit test, eval README | focused unit + dry-run counts |
| TASK-003 | results, baseline evidence | `--kind execution` live run |
| TASK-004 | affected case JSON, audit docs | exact-case/skill reruns |
| TASK-005 | audit docs, workflow evidence/review | unit, validator, dry-run, targeted repeats, full live suite |

## Checkpoint

- Khong chay full suite neu sandbox preflight hoac selector contract fail.
- Khong sua skill chi de lam xanh case bat kha thi; sua case/grader khi evidence cho thay contract eval sai.
- Case vua sua phai PASS hai lan lien tiep truoc full suite neu chi phi cho phep.

## Rui ro va giam thieu

| Rui ro | Tac dong | Giam thieu |
|---|---|---|
| Live eval ton chi phi | Tang token/cost | exact-case va kind filter truoc full suite |
| Model variance | Ket qua khong on dinh | rerun targeted hai lan va tach variance khoi defect |
| Overfit expectation | Lam yeu contract | giu observable behavior, khong giam safeguard |
| Dirty worktree | Mat thay doi nguoi dung | chi sua approved scope, khong revert |

## Rollback

Moi sua doi nam trong runner/case/test/docs va co the co lap theo file; khong dung Git destructive operation.

## Phe duyet

- Quyet dinh: `APPROVED`
- Tham chieu: `CHAY het muc 1 den 5 di`, 2026-09-21
