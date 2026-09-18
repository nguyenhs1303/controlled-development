# Codex workspace

Thư mục này chứa instruction, agent, template, tài liệu và workflow local của Codex cho một repository.

## Phần dùng chung

- `agents/`
- `instructions/common/`
- `templates/`
- `scripts/`

## Phần phải hiệu chỉnh theo repository

- `instructions/repository/`
- `docs/source/`
- `config.toml`
- Root `AGENTS.md` nếu có quy tắc bootstrap hoặc cảnh báo riêng.

Chạy `$repository-bootstrap` sau khi copy starter kit để Codex khám phá repository, hỏi các dữ kiện quan trọng
còn thiếu, cập nhật instruction dựa trên bằng chứng và chạy validator. Bootstrap chỉ chạy khi được gọi rõ; nó
không tự kích hoạt trong feature workflow.

Bootstrap tạo trạng thái resumable tại `.codex/repository-bootstrap.json` từ template tương ứng. Có thể gọi lại
`$repository-bootstrap` trong task mới để resume state bị gián đoạn hoặc để audit instruction đã hoàn tất. Trong
cùng task, nếu Codex hỏi dữ kiện còn thiếu thì chỉ cần trả lời; bootstrap tự tiếp tục mà không cần gọi lại lệnh.

## Phần phát sinh theo repository

- `docs/specs/`, `docs/plans/`, `docs/api/`, `docs/sql/`, `docs/runbooks/`
- `workflows/changes/`
- `archive/`, `logs/`, `cache/` khi thực sự cần

Không đặt source sản phẩm, test, resource runtime hoặc migration chính thức trong `.codex/`.

Plugin runtime được cài ở Codex user scope, không copy cache/plugin runtime vào repository.
Workflow Standard/Deep mặc định tạo tại `.codex/workflows/changes/<change-id>/`.

Starter kit không tạo `.codex/tmp/` và không tạo junction `docs/` ở root.
