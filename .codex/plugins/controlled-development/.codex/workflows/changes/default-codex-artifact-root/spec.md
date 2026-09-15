# Đặc tả: Đổi artifact root mặc định sang `.codex`

## Metadata

- Change ID: `default-codex-artifact-root`
- Profile: `standard`
- Risk: `medium`
- Version: `1.0`
- Status: `APPROVED`

## Mục tiêu

Mọi workflow Standard/Deep do plugin `controlled-development` tạo hoặc resume trong repository mặc định dùng:

```text
.codex/workflows/changes/<change-id>/
```

## Acceptance criteria

- `AC-001`: Artifact Contract, README và state template dùng path mặc định mới.
- `AC-002`: Validator coi path mới là default và vẫn yêu cầu approval cho mọi path khác default.
- `AC-003`: Test/fixture/eval không còn giả định `.ai-workflow` là default.
- `AC-004`: Hai workflow đang hoạt động của source plugin được migrate, giữ nguyên phase/approval/evidence.
- `AC-005`: Workflow hiện có trong repository khác với approved override vẫn tương thích.
- `AC-006`: Plugin được validate, cachebuster, reinstall và Codex liệt kê đúng version mới.
- `AC-007`: Instruction active của `sla-service-fe` không còn bắt buộc override cho default mới.

## Ngoài phạm vi

- Không thay đổi source/runtime của `sla-service-fe`.
- Không sửa marketplace bằng tay.
- Không stage, commit, push, PR, release hoặc deploy.

## Đánh giá hiệu năng

- Thay đổi chỉ là path artifact local và validator; không ảnh hưởng runtime ứng dụng, database hoặc network.
- Số file workflow không đổi; không tăng số lần đọc/ghi đáng kể.
- Xác minh bằng unit test validator, plugin validation và phiên Codex/plugin inventory sau reinstall.

## Phê duyệt

- Spec write/approval và plan approval: người dùng yêu cầu `Làm theo recommendation` sau khi đã xem danh sách file
  ảnh hưởng trong phiên ngày `2026-09-15`.
