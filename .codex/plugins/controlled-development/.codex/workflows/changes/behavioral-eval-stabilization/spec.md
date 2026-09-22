# Dac ta thay doi: On dinh behavioral eval

## Metadata

- Change ID: `behavioral-eval-stabilization`
- Workflow profile: `deep`
- Muc rui ro: `high`
- Trang thai: `APPROVED BY USER REQUEST`

## Muc tieu

Thuc hien tron nam buoc on dinh behavioral eval: xac nhan sandbox, them selective runner, chay lai execution case, triage mismatch con lai, chay targeted regression va full 48-case suite de tao baseline moi co the dung cho quyet dinh release gate.

## Pham vi

- AC-001: Preflight `read-only` va `workspace-write` thuc thi thanh cong hoac co blocker evidence chinh xac.
- AC-002: Runner ho tro loc theo `--kind <dialogue|execution>` va `--case <skill>:<id>` ma khong lam hong cac mode chon cu.
- AC-003: Chay lai dung 9 execution case va phan biet environment failure voi behavioral/expectation failure.
- AC-004: Moi dialogue failure con lai duoc triage thanh `CASE_DEFECT`, `GRADER_DEFECT`, `SKILL_DEFECT` hoac `MODEL_VARIANCE`, va defect trong pham vi duoc sua co regression coverage.
- AC-005: Validator, unit suite, dry-run 48 case, targeted regression va full live suite duoc chay voi receipt hien tai; baseline va ket qua tung case duoc cap nhat trung thuc.

## Ngoai pham vi

- Khong them dependency.
- Khong thay doi plugin runtime ngoai contract behavioral eval.
- Khong sua test de che giau defect thuc.
- Khong commit, push, PR, merge, release hoac deploy.

## Ngu canh du an

- Runner: `evals/runners/run-behavioral-evals.mjs`.
- Case definitions: `evals/cases/*.json`.
- Unit suite: `tests/unit`.
- Validator: `scripts/validators/validate-plugin.mjs`.
- Baseline: `.codex/docs/behavioral-eval-coverage-audit/live-baseline.md`.
- Yeu cau nguoi dung: `CHAY het muc 1 den 5 di` ngay 2026-09-21.

## Can cu yeu cau va quyet dinh

| Noi dung | Phan loai | Nguon |
|---|---|---|
| Thuc hien ca nam buoc, bao gom full live suite | `USER-CONFIRMED DECISION` | Yeu cau nguoi dung 2026-09-21 |
| Bao toan thay doi ngoai pham vi | `EVIDENCED FACT` | `AGENTS.md`, working tree hien tai |
| Full suite co chi phi model va dung provider tuy chinh | `EVIDENCED FACT` | `live-baseline.md` |

## Phan loai rui ro

- Yeu to cao nhat: `scope`, `interface`, `verification`.
- Ly do: runner dung chung va expectation cua nhieu skill co the bi anh huong; full live suite ton chi phi model.
- Dieu kien nang muc: dependency moi, external effect ngoai live eval da yeu cau, hoac thay doi public plugin runtime contract.

## Ranh gioi quyen han

- Duoc phep: preflight local, sua runner/case/test/tai lieu eval, chay live behavioral suite.
- Phai hoi truoc: dependency, CI/infrastructure, public interface ngoai eval tooling, destructive/external operation khac.
- Tuyet doi khong: commit, push, PR, merge, release, deploy, production access, real-data mutation.

## Y dinh xac minh

| Criterion | Buoc kiem tra | Bang chung bat buoc |
|---|---|---|
| AC-001 | Hai Codex sandbox smoke test | Exit 0, command/file observable |
| AC-002 | Unit test parser/filter va CLI dry-run | Exit 0, dung case count |
| AC-003 | `--kind execution` live run | Ket qua 9 case va trace/grading |
| AC-004 | Targeted case/skill rerun | Ket qua truoc/sau va triage artifact |
| AC-005 | Validator, unit, dry-run, full live suite | Receipt hien tai va baseline cap nhat |

## Cau hoi con mo

- Khong co. Nguoi dung da yeu cau chay tron nam buoc.

## Phe duyet

- Quyet dinh: `APPROVED`
- Nguoi phe duyet: nguoi dung
- Tham chieu/thoi gian: `CHAY het muc 1 den 5 di`, 2026-09-21
- Ghi chu: approval bao gom local edits va live model eval calls trong nam buoc da trinh bay.
