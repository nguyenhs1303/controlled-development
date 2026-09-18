# AGENTS.md

Trước mọi công việc, đọc:

1. `.codex/instructions/common/working-rules.md`.
2. `.codex/instructions/common/security.md`.
3. `.codex/instructions/repository/overview.md` và các instruction mà file đó yêu cầu cho công việc hiện tại.

Giữ nguyên thay đổi ngoài phạm vi. Artifact hỗ trợ do Codex quản lý phải nằm dưới `.codex/`; source sản phẩm,
test, resource runtime và migration chính thức vẫn nằm đúng cấu trúc của ứng dụng.

Workflow Standard/Deep mới dùng `.codex/workflows/changes/<change-id>/` và
`artifactRootOverride=null` khi sử dụng đường dẫn mặc định.

Sau khi copy starter kit vào repository mới, chỉ chạy bootstrap khi người dùng gọi rõ
`$repository-bootstrap` hoặc yêu cầu chạy repository bootstrap. Không tự bootstrap trong công việc thông thường.
