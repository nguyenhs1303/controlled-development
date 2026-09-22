# Dac ta thay doi: Toi uu token cho behavioral eval

## Metadata

- Change ID: `token-optimized-behavioral-evals`
- Workflow profile: `deep`
- Muc rui ro: `high`
- Trang thai: `APPROVED`

## Muc tieu

Giam token va so lan goi model cua behavioral eval ma khong giam so luong case, dong thoi giu raw trace de dieu tra khi can.

## Pham vi

- AC-001: Grader chi nhan trace summary gom command, exit code, file thay doi, loi/timeout, hanh dong bi tu choi va final message; raw trace duoc luu rieng.
- AC-002: Runner chay deterministic checks truoc, bo qua model grader khi ket qua da duoc quyet dinh bang code, va chi gui cac expectation con lai cho grader.
- AC-003: Moi behavioral case khai bao chinh xac cac skill/policy/template/schema can dua vao executor prompt; runner khong tu dong nap toan bo tai lieu.
- AC-004: Runner ho tro chon case theo file thay doi; runner/schema chung chay full suite, README-only chay zero case, va dependency khong xac dinh fail closed ve full suite.
- AC-005: Full suite va cach chay mot skill cu van duoc giu lai.

## Ngoai pham vi

- Khong thay doi noi dung nghiep vu ma 45 behavioral case dang danh gia.
- Khong chay behavioral suite ton token neu khong can cho verification cuc bo.
- Khong commit, push, PR, release hoac deploy.

## Ngu canh du an

- Runner: `evals/runners/run-behavioral-evals.mjs`.
- Case definitions: `evals/cases/*.json`.
- Structural validator: `scripts/validators/validate-plugin.mjs`.
- Unit tests: `tests/unit/validate-plugin.test.mjs`.
- Lenh xac minh co bang chung: `node --test tests/unit/*.test.mjs`, `node scripts/validators/validate-plugin.mjs`, `node evals/runners/run-behavioral-evals.mjs --all --dry-run`.

## Can cu yeu cau va quyet dinh

| Noi dung | Phan loai | Nguon |
|---|---|---|
| Thu tu trien khai `3 -> 2 -> 1 -> 4` | `USER-CONFIRMED DECISION` | Yeu cau nguoi dung ngay 2026-09-19 |
| Hoan thanh toan bo, khong dung xin xac nhan tung buoc | `USER-CONFIRMED DECISION` | Yeu cau nguoi dung ngay 2026-09-19 |
| Bao toan thay doi ngoai pham vi | `EVIDENCED FACT` | `AGENTS.md`, working tree hien tai |

## Phan loai rui ro

- Yeu to cao nhat: `scope`, `interface`, `verification`.
- Ly do: thay doi runner dung chung, schema case va cach chon toan bo suite.
- Dieu kien nang muc: da o muc `deep`; dependency moi hoac external effect van bi cam.

## Ranh gioi quyen han

- Duoc phep: sua runner, case JSON, validator, test va tai lieu eval trong plugin.
- Khong can dependency moi.
- Tuyet doi khong: commit, push, PR, merge, deploy, production access, real-data mutation.

## Y dinh xac minh

| Criterion | Buoc kiem tra | Bang chung bat buoc |
|---|---|---|
| AC-001 | Unit test trace summary va prompt khong chua raw trace | Exit 0 va assertion |
| AC-002 | Unit test deterministic-only, partial semantic va fail-fast | Exit 0 va assertion |
| AC-003 | Validator + dry-run toan bo case | Exit 0; 45 case hop le |
| AC-004 | Unit test impact selection | Exit 0 cho skill/policy/shared/README/unknown |
| AC-005 | Validator va dry-run CLI | Exit 0 |

## Cau hoi con mo

- Khong co.

## Phe duyet

- Quyet dinh: `APPROVED`
- Nguoi phe duyet: nguoi dung
- Tham chieu/thoi gian: yeu cau tiep tuc va dong y toan bo pham vi ngay 2026-09-19
- Ghi chu: khong mo rong ngoai bon de xuat va cac test/tai lieu can thiet.
