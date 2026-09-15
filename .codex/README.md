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

## Phần phát sinh theo repository

- `docs/specs/`, `docs/plans/`, `docs/api/`, `docs/sql/`, `docs/runbooks/`
- `workflows/changes/`
- `archive/`, `logs/`, `cache/` khi thực sự cần

Không đặt source sản phẩm, test, resource runtime hoặc migration chính thức trong `.codex/`.

Plugin runtime được cài ở Codex user scope, không copy cache/plugin runtime vào repository.
Workflow Standard/Deep mặc định tạo tại `.codex/workflows/changes/<change-id>/`.

Starter kit không tạo `.codex/tmp/` và không tạo junction `docs/` ở root.
