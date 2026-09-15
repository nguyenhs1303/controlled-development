# Quy tắc làm việc chung

## Phạm vi và working tree

- Đọc `AGENTS.md` và instruction áp dụng trước khi khám phá hoặc ghi file.
- Dùng `rg` hoặc `rg --files` để xác nhận call site, đường dẫn và phạm vi trước khi kết luận.
- Bảo toàn mọi thay đổi ngoài phạm vi; không tự ý revert, xóa, dọn hoặc đưa vào staging.
- Nếu xuất hiện thay đổi bất ngờ không phải do Codex tạo, dừng và hỏi người dùng.
- Không stage, commit, push, tạo PR, merge, release, deploy hoặc truy cập production nếu workflow hiện tại không
  cho phép rõ ràng.

## Chính sách artifact

- Instruction và agent: `.codex/instructions/`, `.codex/agents/`.
- Spec, plan, API, SQL và runbook: `.codex/docs/`.
- Workflow, evidence và review: `.codex/workflows/changes/`.
- Template và script: `.codex/templates/`, `.codex/scripts/`.
- Archive, log hoặc cache chỉ tạo dưới `.codex/` khi thực sự cần.
- Không đặt source sản phẩm, test, resource runtime hoặc migration chính thức trong `.codex/`.
- Không tạo `.ai-workflow/` mới.

## Controlled workflow

- Plugin runtime thuộc Codex user scope; không copy plugin cache/runtime vào repository.
- Workflow Standard/Deep tạo tại `.codex/workflows/changes/<change-id>/`.
- Dùng `artifactRootOverride=null` cho đường dẫn mặc định.
- Khi resume, validate state, approval và Git baseline trước khi ghi.

## Cách triển khai

- Thực hiện thay đổi nhỏ, có thể xác minh và đúng phạm vi đã duyệt.
- Không dọn nợ kỹ thuật lân cận nếu không thuộc yêu cầu.
- Tuân thủ convention, ngôn ngữ hiển thị và quy tắc comment của repository đích.
