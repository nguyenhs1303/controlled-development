# Kế hoạch triển khai: Chuẩn hóa cấu trúc portable plugin

## Metadata

- Change ID: `portable-plugin-layout`
- Tham chiếu phê duyệt đặc tả: session 2026-09-19
- Tham chiếu phê duyệt giải pháp: session 2026-09-19, solution `v1`
- Mức rủi ro: `medium`
- Bắt buộc phê duyệt kế hoạch: `no`

## Cách tiếp cận

Thực hiện migration tăng dần đúng tám bước, giữ compatibility overlay trong toàn bộ quá trình, cập nhật automated checks trước khi coi layout cũ đã được thay thế.

## Truy vết giải pháp đã duyệt

| Task/Quyết định | Solution section | Acceptance criterion | Bằng chứng/nguồn |
|---|---|---|---|
| Portable manifest | Kiến trúc được đề xuất | AC-001, AC-002 | OpenAI Docs |
| Boundary migration | Kiến trúc được đề xuất | AC-003 đến AC-007 | source hiện tại và solution v1 |
| Verification matrix | Verification conditions | AC-008 | native commands hiện tại |

## Sơ đồ phụ thuộc

```text
TASK-001 -> TASK-002 -> TASK-003 -> TASK-004 -> TASK-005 -> TASK-006 -> TASK-007 -> TASK-008
```

## Danh sách task

| Task | Acceptance criteria | Phụ thuộc | File dự kiến | Xác minh |
|---|---|---|---|---|
| TASK-001 | AC-001 | None | `plugin.json` | manifest parse/schema checks |
| TASK-002 | AC-002 | TASK-001 | `.codex-plugin/plugin.json`, validator tests | consistency test |
| TASK-003 | AC-002, AC-008 | TASK-002 | package validator | focused unit test |
| TASK-004 | AC-003 | TASK-003 | `scripts/`, `tests/`, `evals/` | import/unit checks |
| TASK-005 | AC-004 | TASK-004 | `assets/workflow-templates/`, skills | link validation |
| TASK-006 | AC-006 | TASK-005 | state/package validators, controller | controller tests |
| TASK-007 | AC-005, AC-007 | TASK-006 | references, README, eval cases | search + trigger eval |
| TASK-008 | AC-008 | TASK-007 | toàn package | full verification matrix |

## Checkpoint

- Sau TASK-003: hai manifest được validator bảo vệ.
- Sau TASK-006: runtime/controller hoạt động trên boundary mới.
- Sau TASK-008: full matrix và plugin validator hoàn tất hoặc có lý do `NOT RUN` cụ thể.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| Stale relative path | Skill hoặc test không chạy | search toàn repo và link validator |
| Manifest drift | host hiển thị metadata khác nhau | validator so sánh identity/interface |
| Runtime kéo dev tooling | package phình và coupling | state validator riêng trong runtime |
| Fixture path sai | eval/test pass giả hoặc không chạy | focused test và full dry-run |

## Rollback/Phục hồi

Mọi thay đổi chỉ ở working tree và có thể hoàn tác theo file/rename cục bộ; không stage, commit, install hoặc publish.

## Phê duyệt kế hoạch

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: yêu cầu chạy một mạch đến mục 8, session 2026-09-19
- Ghi chú: kế hoạch chính là tám mục migration đã được xác nhận.
