# Kế hoạch triển khai: State schema v3

## Metadata

- Change ID: `state-schema-v3`
- Tham chiếu phê duyệt đặc tả: `Duyệt spec state-schema-v3 version 1` — 2026-09-18
- Tham chiếu phê duyệt giải pháp: `duyệt` — solution `state-schema-v3` version 1 — 2026-09-18
- Mức rủi ro: `high`
- Bắt buộc phê duyệt kế hoạch: `yes`

## Cách tiếp cận

Triển khai theo red-green từng invariant, ưu tiên contract và fail-closed behavior trước khi đổi template/fixture.
Mỗi task chỉ mở rộng extension point đã duyệt trong `scripts/validate.mjs`; không tách transition rules, không tạo
CLI hoặc thực hiện filesystem mutation. Sau mỗi nhóm task chạy focused tests, sau cùng chạy toàn bộ regression và
review diff để xác nhận không vượt phạm vi.

## Truy vết giải pháp đã duyệt

| Task/Quyết định | Solution section | Acceptance criterion | Bằng chứng/nguồn |
|---|---|---|---|
| TASK-001 định nghĩa reference `sha256-text-v1` | Kiến trúc được đề xuất; Chi tiết contract triển khai | AC-006 | Spec version 1, solution version 1 |
| TASK-002 thêm core schema 3 và future-version rejection | Data/runtime flow; Chi tiết contract triển khai | AC-002, AC-003, AC-008 | `scripts/validate.mjs`, solution version 1 |
| TASK-003 thêm approval binding validation | Chi tiết contract triển khai | AC-004, AC-005 | Spec version 1, solution version 1 |
| TASK-004 chuyển template và fixture chính, chứng minh compatibility | Boundary/component; Verification conditions | AC-001, AC-007 | `templates/state.json`, fixture hiện tại |
| TASK-005 chuyển fixture bổ trợ sang current schema | Boundary/component; Verification conditions | AC-002, AC-004, AC-007 | `evals/fixtures/workflow-state/` |
| TASK-006 chạy regression và review phạm vi | Verification conditions | AC-009, AC-010 | Lệnh native đã xác minh ở baseline |
| Tên helper, constant và cách nhóm table test | Giải pháp khuyến nghị | AC-002 đến AC-008 | `INTERNAL CHOICE`: cục bộ, có thể hoàn tác, không đổi contract |

## Sơ đồ phụ thuộc

```text
TASK-001
   -> TASK-002
      -> TASK-003
         -> TASK-004
            -> TASK-005
               -> TASK-006
```

Không có cycle. Thứ tự đặt contract trước implementation, core fields trước approval binding, và validator hoàn
chỉnh trước khi chuyển các fixture dùng cho structural validation.

## Danh sách task

| Task | Acceptance criteria | Phụ thuộc | File dự kiến | Xác minh |
|---|---|---|---|---|
| TASK-001 | AC-006 | None | `references/workflow-state-schema.md`, `scripts/validate.test.mjs` | `node --test --test-name-pattern="workflow state schema reference" scripts/validate.test.mjs` |
| TASK-002 | AC-002, AC-003, AC-008 | TASK-001 | `scripts/validate.mjs`, `scripts/validate.test.mjs` | Focused schema-3 core tests, rồi toàn bộ `node --test scripts/validate.test.mjs` |
| TASK-003 | AC-004, AC-005 | TASK-002 | `scripts/validate.mjs`, `scripts/validate.test.mjs` | Focused approval-binding tests, rồi toàn bộ unit suite |
| TASK-004 | AC-001, AC-007 | TASK-003 | `templates/state.json`, `evals/fixtures/workflow-state/valid-state.json`, `evals/fixtures/workflow-state/invalid-state.json`, `scripts/validate.test.mjs` | Template/compatibility tests và `node scripts/validate.mjs` |
| TASK-005 | AC-002, AC-004, AC-007 | TASK-004 | `evals/fixtures/workflow-state/blocker-limit-state.json`, `evals/fixtures/workflow-state/remediation-state.json`, `evals/fixtures/workflow-state/remediation-limit-state.json`, `evals/fixtures/workflow-state/learning-retrospective-state.json`, `scripts/validate.test.mjs` | Supplemental fixture assertions và structural validation |
| TASK-006 | AC-009, AC-010 | TASK-005 | `evals/fixtures/workflow-state/README.md`, `.codex/workflows/changes/state-schema-v3/evidence.md` | Unit, structural, trigger eval, plugin validator và diff review |

## Checkpoint

- Sau TASK-001: reference test `PASS`; contract hashing không phụ thuộc code runtime.
- Sau TASK-002: valid/invalid core schema 3 và future version tests `PASS`; full unit suite vẫn xanh.
- Sau TASK-003: approval binding table tests `PASS`; schema 1/2 tests vẫn xanh.
- Sau TASK-004: template và fixture chính được structural validator chấp nhận; compatibility test chứng minh không
  mutation.
- Sau TASK-005: toàn bộ workflow-state fixture current behavior dùng schema 3 nơi phù hợp; structural validation
  `PASS`.
- Sau TASK-006: đủ receipt cho AC-001 đến AC-010 trước khi vào review.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| Rule schema 3 vô tình áp lên schema 1/2 | Resume legacy bị từ chối | Guard rõ theo version; deep-equal mutation-free tests cho schema 1/2 |
| Approval mapping sai gate/artifact | Approval có thể gắn nhầm artifact | Constant mapping cố định và table-driven negative tests cho từng gate |
| Fixture chuyển version che mất compatibility coverage | Không còn bằng chứng legacy | Tạo state schema 1/2 riêng trong test trước khi chuyển fixture current-state |
| Error ordering làm test mong manh | Regression giả khi thêm invariant | Assert marker lỗi theo field/invariant, không snapshot toàn bộ danh sách lỗi |
| Phạm vi trượt sang controller/transition | Trùng đầu việc 3–7 | Diff review theo AC-010; không thêm script CLI, file store, event hoặc skill mutation |
| Working tree có thay đổi ngoài phạm vi | Có nguy cơ ghi đè công việc người dùng | Chỉ patch file được liệt kê; kiểm tra diff theo path và không revert thay đổi ngoài phạm vi |

## Permission và giới hạn thực thi

- Không thêm dependency, migration, CI/build contract hoặc public interface.
- Không chạy external service hoặc command có side effect ngoài local workspace.
- Không stage, commit, push, tạo PR, merge, release hoặc deploy.
- Nếu implementation cho thấy cần tách module hoặc thay đổi transition semantics, quay lại `SOLUTION DESIGN`
  thay vì tự mở rộng plan.

## Rollback/Phục hồi

Mỗi task là một diff cục bộ có thể cô lập theo file. Khi test của task không đạt, chỉ sửa phần thuộc task và giữ
nguyên thay đổi ngoài phạm vi. Không tự động migrate state thật; rollback implementation không yêu cầu phục hồi
schema 1/2 vì validator không được mutate input hoặc ghi file.

## Phê duyệt kế hoạch

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: phê duyệt bao quát `chạy đến mục 10 luôn... không cần hỏi lại` — 2026-09-18
- Ghi chú: duyệt plan chỉ cho phép triển khai các file và bước kiểm tra nêu trên, không cho phép các đầu việc CLI,
  controller, state store, event ledger, skill integration hoặc marketplace sync
