# Codex repository starter kit

Bộ khung này dùng để bootstrap Codex cho repository mới mà không mang theo workflow, tài liệu domain,
Git baseline hoặc secret của repository nguồn.

## Cài vào repository mới

Chạy từ thư mục starter kit:

```powershell
pwsh -File .\install.ps1 -Destination <repository-root>
```

Script từ chối ghi đè nếu repository đích đã có `.codex/` hoặc `AGENTS.md`.

Sau khi cài:

1. Cập nhật `.codex/instructions/repository/` theo stack và convention thực tế.
2. Cập nhật `.codex/config.toml` nếu repository cần MCP project-scoped.
3. Chọn chính sách Git trong `.codex/templates/`.
4. Cài plugin `controlled-development` ở user scope trên máy nếu chưa có.
5. Trust repository để Codex nạp `.codex/config.toml`.
6. Mở session Codex mới từ repository đích.

## Nội dung được phân phối

- `AGENTS.md`: bootstrap instruction ở root.
- `.codex/agents/`: năm vai trò phát triển.
- `.codex/instructions/common/`: quy tắc dùng chung.
- `.codex/instructions/repository/`: khung instruction cần hiệu chỉnh theo repo.
- `.codex/docs/`: nơi lưu tài liệu nguồn, spec, plan, API, SQL và runbook.
- `.codex/templates/`: mẫu artifact và mẫu `.gitignore`.
- `.codex/scripts/`: initialize, validate và secret scan.
- `.codex/workflows/changes/`: artifact Standard/Deep do plugin tạo theo change ID.

Không phân phối `archive/`, `logs/`, `cache/`, `tmp/`, workflow cũ hoặc plugin runtime/cache.

## Xác minh

```powershell
pwsh -File .codex/scripts/validate-structure.ps1
pwsh -File .codex/scripts/validate-references.ps1
pwsh -File .codex/scripts/scan-secrets.ps1
pwsh -File .codex/scripts/validate-portability.ps1
```

Starter kit không tạo junction `docs/`. Repository có thư mục `docs/` của sản phẩm vẫn sử dụng bình thường;
artifact của Codex luôn nằm dưới `.codex/docs/`.
