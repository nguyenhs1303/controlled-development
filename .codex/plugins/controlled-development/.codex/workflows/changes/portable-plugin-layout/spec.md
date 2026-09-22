# Đặc tả thay đổi: Chuẩn hóa cấu trúc portable plugin

## Metadata

- Change ID: `portable-plugin-layout`
- Workflow profile: `standard`
- Mức rủi ro: `medium`
- Trạng thái: `APPROVED`

## Mục tiêu

Kiến trúc lại package `controlled-development` theo cấu trúc portable Agent Plugins hiện hành của OpenAI, đồng thời giữ compatibility overlay cho các Codex host cũ và không thay đổi workflow behavior đã công bố.

## Phạm vi

- Thêm root `plugin.json` theo Agent Plugins schema, chứa identity portable và `extensions.com.openai`.
- Giữ `.codex-plugin/plugin.json` trong ít nhất chu kỳ phát hành này và kiểm tra tính nhất quán với root manifest.
- Phân tách runtime, validator phát triển, unit test, fixture và eval runner thành các boundary rõ ràng.
- Chuyển workflow template sang `assets/workflow-templates/`.
- Phân nhóm shared reference thành `references/policies/` và `references/schemas/`.
- Tách workflow-state validation dùng lúc runtime khỏi package validation dùng lúc phát triển.
- Cập nhật toàn bộ link, import, command và validator theo layout mới.
- Chạy validator, unit test, trigger eval, behavioral dry-run và plugin validator phù hợp.

## Ngoài phạm vi

- Không thêm hook, MCP server, app integration hoặc dependency mới.
- Không thay đổi state schema, workflow phase, approval semantics hay behavior của các skill.
- Không sửa marketplace, cài lại plugin, publish, release hoặc deploy.
- Không di chuyển hoặc xóa các workflow artifact lịch sử ngoài change hiện tại.

## Acceptance criteria

- [ ] AC-001: Root `plugin.json` hợp lệ theo Agent Plugins schema và trở thành identity portable của plugin.
- [ ] AC-002: `.codex-plugin/plugin.json` vẫn tồn tại, hợp lệ và nhất quán với root manifest về identity/OpenAI interface.
- [ ] AC-003: Runtime scripts, development validators, unit tests, fixtures và eval runners nằm trong boundary riêng, không còn trộn chung trong `scripts/`.
- [ ] AC-004: Workflow templates nằm dưới `assets/workflow-templates/`; mọi skill và runtime reference resolve đúng.
- [ ] AC-005: Shared references được phân nhóm mà không tạo link hỏng hoặc thay đổi nội dung policy.
- [ ] AC-006: Workflow state validator có thể được runtime controller sử dụng mà không kéo package/eval validation vào runtime path.
- [ ] AC-007: README, skill instructions, eval cases, imports và native commands phản ánh layout mới.
- [ ] AC-008: Tất cả kiểm tra cấu trúc, unit, controller, trigger eval và behavioral dry-run vượt qua; plugin validator được chạy nếu môi trường hỗ trợ.

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: `AGENTS.md`, `.codex/instructions/common/working-rules.md`, `.codex/instructions/common/security.md`, `.codex/instructions/repository/{overview,architecture,code-conventions,local-development}.md`.
- Lệnh gốc và nguồn xác định: các lệnh trong `README.md` và implementation hiện tại của `scripts/validate.mjs`.
- Module/pattern liên quan: `.codex-plugin/plugin.json`, `skills/`, `references/`, `templates/`, `scripts/`, `evals/`.

## Căn cứ yêu cầu và quyết định

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| Chạy trọn tám bước migration an toàn | `USER-CONFIRMED DECISION` | Người dùng xác nhận trong session ngày 2026-09-19 |
| Root portable manifest là hướng package mới; compatibility manifest vẫn được hỗ trợ | `EVIDENCED FACT` | OpenAI Docs: `https://developers.openai.com/plugins/build/plugins` |
| Skill-local resources dùng `references/`, `assets/`, `scripts/` và root `skills/` được discovery | `EVIDENCED FACT` | OpenAI Docs: `https://developers.openai.com/plugins/build/skills` |
| Không vẽ sơ đồ hoặc tạo tài liệu kiến trúc riêng | `USER-CONFIRMED DECISION` | Người dùng xác nhận trong session ngày 2026-09-19 |

## Giả định triển khai không trọng yếu

1. Dùng tên thư mục mô tả trách nhiệm: `runtime`, `validators`, `unit`, `fixtures`, `runners`.
2. Giữ nội dung policy/template nguyên nghĩa khi di chuyển; chỉ cập nhật link/path.
3. Giữ version base `0.1.0` và đồng bộ cachebuster giữa hai manifest ở bước hoàn tất.

## Phân loại rủi ro

- Yếu tố cao nhất: scope và internal shared interface ở mức Medium.
- Lý do: thay đổi nhiều path được dùng bởi tất cả skill, validator, controller và test nhưng không đổi public API, dependency, security hay external system.
- Điều kiện nâng mức: phát hiện yêu cầu đổi state schema, dependency, marketplace, hook/MCP hoặc behavior workflow.

## Ranh giới quyền hạn

- Được phép: sửa source plugin và artifact workflow cục bộ trong phạm vi đã liệt kê; chạy kiểm tra local không phá hủy.
- Phải hỏi trước: thêm dependency, sửa marketplace, cài lại/publish plugin, thay đổi CI hoặc external system.
- Tuyệt đối không: commit, push, PR, merge, deploy, production access, real-data mutation.

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001, AC-002 | package validator và plugin-creator validator | exit code 0, manifest consistency assertions |
| AC-003, AC-006 | unit tests và import/runtime tests | test receipts sau migration |
| AC-004, AC-005, AC-007 | Markdown link validation, source search, trigger evals | không link/import cũ; trigger cases pass |
| AC-008 | full native command matrix | receipt cho từng command |

## Câu hỏi còn mở

- Không có.

## Phê duyệt

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: xác nhận chạy một mạch toàn bộ tám mục, session 2026-09-19
- Ghi chú phạm vi được duyệt: đúng tám bước migration đã trình bày; không mở rộng sang marketplace hoặc shipping.
