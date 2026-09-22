# Bằng chứng: Chuẩn hóa cấu trúc portable plugin

## Biên nhận EVID-001

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19, trước BUILD
- Bước kiểm tra: baseline validator, unit/controller tests và trigger eval
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0
- Git baseline: `f8d010d222c1d75d51e22a1eca843a84e945b031`, working tree sạch trước artifact write
- Chứng minh cho: discovery baseline và regression starting point
- Kết quả liên quan: package validator pass; 53 + 4 + 11 tests pass; trigger evals 33 positives và 33 rank-1 pass.
- Giới hạn/lý do: pre-change baseline, không chứng minh layout mới.

## Biên nhận EVID-002

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `node scripts/validators/validate-plugin.mjs`
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`, working tree chứa change hiện tại
- Chứng minh cho: AC-001 đến AC-007
- Kết quả liên quan: portable/compatibility manifests, skill anatomy, links, templates, scripts, fixtures, eval cases và workflow states đều hợp lệ.
- Giới hạn/lý do: validator nội bộ của repository.

## Biên nhận EVID-003

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `node --test tests/unit`
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0; 69 tests pass, 0 fail
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-002, AC-003, AC-006, AC-008
- Kết quả liên quan: manifest drift detection, state validation, controller ledger/locking, transition rules và fixtures đều pass.
- Giới hạn/lý do: deterministic local tests.

## Biên nhận EVID-004

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `node evals/runners/run-trigger-evals.mjs`
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-007, AC-008
- Kết quả liên quan: 33 positive triggers và 33 rank-1 results pass.
- Giới hạn/lý do: deterministic trigger scoring, không gọi model.

## Biên nhận EVID-005

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `node evals/runners/run-behavioral-evals.mjs --all --dry-run`
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-003, AC-004, AC-005, AC-007, AC-008
- Kết quả liên quan: 45 behavioral evals được materialize/planned thành công trên path mới.
- Giới hạn/lý do: execution/grading model `NOT RUN` theo chủ đích dry-run.

## Biên nhận EVID-006

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `node --check` cho mọi `.mjs` trong runtime/validators/eval runners/unit tests và `git diff --check`
- Thư mục làm việc/đối tượng: plugin root
- Mã thoát/kết quả: 0
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-003, AC-006, AC-007, AC-008
- Kết quả liên quan: không syntax error hoặc whitespace error; chỉ có cảnh báo line-ending CRLF của Git trên Windows.
- Giới hạn/lý do: không thay thế behavioral execution.

## Biên nhận EVID-007

- Trạng thái: `PASS`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: tải `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` và chạy `Test-Json -Schema` với root `plugin.json`
- Thư mục làm việc/đối tượng: `plugin.json`
- Mã thoát/kết quả: `True`
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-001
- Kết quả liên quan: portable manifest hợp lệ với schema được OpenAI Docs tham chiếu.
- Giới hạn/lý do: chỉ kiểm tra portable root manifest.

## Biên nhận EVID-008

- Trạng thái: `NOT RUN`
- Thời gian/tham chiếu: session 2026-09-19
- Bước kiểm tra: `plugin-creator/scripts/validate_plugin.py .` và `skill-creator/scripts/quick_validate.py`
- Thư mục làm việc/đối tượng: plugin root và 11 skill directories
- Mã thoát/kết quả: khởi động thất bại trước validation
- Git baseline: HEAD `f8d010d222c1d75d51e22a1eca843a84e945b031`
- Chứng minh cho: AC-008 verification gap
- Kết quả liên quan: `ModuleNotFoundError: No module named 'yaml'` trên cả `python` và `py`; `python3` không khả dụng.
- Giới hạn/lý do: không tự cài `PyYAML` vì thêm dependency ngoài phạm vi và cần permission riêng.

## Ma trận acceptance criterion

| Criterion | Bằng chứng triển khai | Biên nhận xác minh | Trạng thái |
|---|---|---|---|
| AC-001 | `plugin.json` | EVID-002, EVID-007 | `PASS` |
| AC-002 | `.codex-plugin/plugin.json`, manifest consistency validation | EVID-002, EVID-003 | `PASS` |
| AC-003 | `scripts/{runtime,validators}`, `tests/`, `evals/runners/` | EVID-002, EVID-003, EVID-005 | `PASS` |
| AC-004 | `assets/workflow-templates/`, updated skill links | EVID-002, EVID-005 | `PASS` |
| AC-005 | `references/{policies,schemas}` | EVID-002, EVID-005 | `PASS` |
| AC-006 | `scripts/runtime/validate-workflow-state.mjs` và controller import graph | EVID-003, EVID-006 | `PASS` |
| AC-007 | README, skills, eval runners và tests | EVID-002, EVID-004, EVID-005 | `PASS` |
| AC-008 | full deterministic verification matrix | EVID-002 đến EVID-008 | `PASS` với Python validator gap được ghi `NOT RUN` theo điều kiện môi trường |
