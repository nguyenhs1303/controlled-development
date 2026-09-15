# Đặc tả thay đổi: Xin phép trước khi xóa artifact của workflow

## Metadata

- Change ID: `artifact-cleanup-consent`
- Workflow profile: `deep`
- Mức rủi ro: `high`
- Phiên bản đặc tả: `1`
- Trạng thái: `DRAFT`

## Mục tiêu

Sau khi báo cáo cuối cùng được trình bày, Controlled Development phải hỏi người dùng có muốn xóa các artifact do plugin tạo cho đúng change hiện tại hay không. Plugin chỉ được xóa sau khi nhận được xác nhận rõ ràng; nếu người dùng từ chối, không trả lời hoặc trả lời mơ hồ thì phải giữ nguyên artifact.

## Phạm vi

- Thêm bước quyết định cleanup sau `FINAL REPORT` và trước `STOP`.
- Hiển thị chính xác artifact root và danh sách file dự kiến xóa trước khi xin phép.
- Chỉ cho phép xóa các file artifact chuẩn do plugin tạo cho change ID hiện tại.
- Kiểm tra lại đường dẫn an toàn ngay trước khi xóa và báo kết quả sau thao tác.
- Cập nhật policy, template, validator, test, behavioral eval và README liên quan.

## Ngoài phạm vi

- Không tự động xóa khi chưa có xác nhận rõ ràng ở thời điểm cleanup.
- Không xóa source code, test sản phẩm, file không rõ nguồn gốc, toàn bộ `.codex/workflows/`, hoặc artifact của change khác.
- Không thêm cơ chế tự học, tự sửa `AGENTS.md`, memory, skill hoặc plugin sau mỗi change.
- Không commit, push, tạo pull request, merge, release hoặc deploy.

## Hành vi phải được giữ nguyên

- Ba terminal state vẫn là `REVIEW PASSED`, `REVIEW BLOCKED`, và `IMPLEMENTATION BLOCKED`.
- Final report vẫn phải được ghi và trình bày trước khi hỏi cleanup.
- Artifact vẫn là mặc định được giữ lại cho đến khi có phê duyệt xóa riêng biệt.
- Quick không tạo artifact thì chỉ thông báo cleanup không cần thiết rồi `STOP`.

## Acceptance criteria

- [ ] AC-001: Sau `FINAL REPORT`, nếu change có artifact, agent hiển thị artifact root và chính xác các file do plugin quản lý rồi hỏi người dùng có muốn xóa hay không.
- [ ] AC-002: Không có xác nhận rõ ràng, xác nhận từ trước, im lặng, từ chối hoặc câu trả lời mơ hồ đều không cho phép xóa; artifact được giữ nguyên.
- [ ] AC-003: Khi người dùng xác nhận rõ ràng, agent chỉ xóa các file artifact chuẩn thuộc đúng change ID hiện tại sau khi xác thực đường dẫn là project-relative, không chứa traversal và kết thúc bằng change ID.
- [ ] AC-004: Nếu artifact root chứa file hoặc thư mục không thuộc bộ artifact chuẩn, agent giữ lại nội dung không rõ nguồn gốc và không xóa cả thư mục root một cách đệ quy.
- [ ] AC-005: Với terminal state bị chặn, câu hỏi cleanup cảnh báo rằng xóa artifact sẽ làm mất trạng thái phục hồi; vẫn cần xác nhận riêng sau cảnh báo.
- [ ] AC-006: Với Quick không tạo artifact, agent thông báo không cần cleanup và chuyển tới `STOP` mà không hỏi xóa giả định.
- [ ] AC-007: Validator, unit test và behavioral eval chứng minh legal transitions và các ranh giới cleanup mới; toàn bộ validation hiện có vẫn vượt qua.
- [ ] AC-008: README giải thích rõ cleanup là tùy chọn, có phê duyệt, và plugin không tự động học hay cập nhật kinh nghiệm sau mỗi change.

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: không có `AGENTS.md` hoặc `CLAUDE.md` trong `C:/Users/BnK`, `C:/Users/BnK/plugins` hay plugin source.
- Nguồn plugin: `C:/Users/BnK/plugins/controlled-development`.
- Git: thư mục nguồn hiện không phải Git repository; không có baseline commit để thay đổi hoặc bảo vệ.
- Lệnh gốc: `node scripts/validate.mjs .` và `node --test scripts/validate.test.mjs`, xác định từ `scripts/validate.test.mjs` và lịch sử kiểm chứng của plugin.
- Thành phần liên quan: orchestrator skill, permission/DoD policies, final-review template, state validator/tests, controlled-development evals và README.

## Giả định

1. “Các file liên quan do plugin tạo ra” là bộ file chuẩn bên trong artifact root của đúng change ID: `spec.md`, `plan.md`, `tasks.md`, `state.json`, `evidence.md`, `final-review.md`.
2. Câu hỏi cleanup xuất hiện sau khi người dùng đã nhận được final report, vì artifact có thể chứa bằng chứng cần xem trước khi quyết định xóa.
3. Xóa artifact không đồng nghĩa với hoàn tác source code đã phát triển.

## Phân loại rủi ro

- Yếu tố cao nhất: thao tác xóa có tính phá hủy và có thể làm mất audit trail/trạng thái resume.
- Lý do: workflow lõi và state machine thay đổi; đường dẫn cleanup sai có thể xóa nhầm dữ liệu người dùng.
- Điều kiện nâng mức: đã chọn mức cao nhất `deep`; mọi mở rộng sang auto-learning hoặc xóa ngoài artifact root phải quay lại phê duyệt đặc tả.

## Ranh giới quyền hạn

- Được phép sau phê duyệt đặc tả/kế hoạch: sửa các file plugin và chạy validation cục bộ đã nêu.
- Phải hỏi riêng lúc runtime: xóa artifact của từng change sau final report.
- Tuyệt đối không: xóa theo glob chưa xác thực, xóa đệ quy `.codex/workflows`, xóa file không rõ nguồn gốc, commit, push, PR, merge, deploy, production access, real-data mutation.

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001..AC-006 | Unit test validator và behavioral eval cho nhánh cleanup | Receipt lệnh, exit code và expectation tương ứng |
| AC-007 | `node scripts/validate.mjs .` và `node --test scripts/validate.test.mjs` | Kết quả `PASS` hiện tại sau mọi chỉnh sửa |
| AC-008 | Kiểm tra README và tìm kiếm các tuyên bố liên quan | Vị trí nội dung và xác nhận không mâu thuẫn policy |

## Câu hỏi còn mở

- Không có. Cơ chế auto-learning được giữ ngoài phạm vi và chỉ được xem xét như một change riêng có cổng phê duyệt.

## Phê duyệt

- Quyết định: `PENDING`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: phiên hiện tại, sau khi đặc tả phiên bản 1 được trình bày
- Ghi chú phạm vi được duyệt: chưa có
