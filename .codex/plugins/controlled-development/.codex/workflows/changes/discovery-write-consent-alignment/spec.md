# Đặc tả thay đổi: Đồng bộ DISCOVER với quyền ghi đặc tả

## Metadata

- Change ID: `discovery-write-consent-alignment`
- Workflow profile: `standard`
- Mức rủi ro: `medium`
- Phiên bản đặc tả: `1`
- Trạng thái: `APPROVED`

## Mục tiêu

Loại bỏ mâu thuẫn giữa `project-discovery` và cổng `Specification Write Consent`, để quá trình khám phá vẫn có thể đọc và báo cáo bằng chứng nhưng không tự tạo hoặc cập nhật artifact đặc tả khi người dùng chưa cho phép ghi.

## Phạm vi

- Cập nhật `project-discovery` để phân nhánh rõ ràng theo việc đã có hay chưa có `Specification Write Consent`.
- Khi chưa có consent, giữ kết quả discovery trong hội thoại và không sửa `spec.md`, `state.json`, workflow mirror, approval metadata hoặc evidence receipt khẳng định kết quả đã được lưu.
- Khi đã có consent, cho phép ghi kết quả discovery cần thiết vào artifact Standard/Deep theo workflow hiện hành.
- Thêm behavioral eval cho trường hợp discovery chưa có quyền ghi artifact.
- Chạy lại validation, trigger eval, unit test và behavioral dry-run hiện có.

## Ngoài phạm vi

- Không xử lý việc `.codex/workflows` bị đóng gói vào installed cache.
- Không triển khai yêu cầu xóa artifact sau `FINAL REPORT`.
- Không thay đổi state machine, risk matrix, terminal state hoặc ranh giới shipping.
- Không commit, push, tạo pull request, merge, release hoặc deploy.

## Hành vi phải được giữ nguyên

- `project-discovery` vẫn đọc project instructions trước khi khám phá repository.
- Discovery vẫn được phép thực hiện các thao tác chỉ đọc trước write consent.
- Khi resume một change đã có artifact hợp lệ, discovery vẫn có thể cập nhật trạng thái theo quyền đã tồn tại.
- Các lệnh và bằng chứng phải tiếp tục được lấy từ nguồn gốc của dự án, không suy đoán.

## Acceptance criteria

- [ ] AC-001: `project-discovery` nêu rõ rằng discovery chỉ đọc và báo cáo trong hội thoại được phép trước `Specification Write Consent`.
- [ ] AC-002: Khi chưa có write consent, skill cấm tạo/cập nhật `spec.md`, `state.json`, workflow mirror, approval metadata và evidence receipt khẳng định nội dung đã được persist.
- [ ] AC-003: Khi đã có write consent cho nội dung hiện tại, Standard/Deep được ghi các kết quả discovery cần thiết vào artifact theo contract hiện hành.
- [ ] AC-004: Khi không còn câu hỏi làm rõ quan trọng nhưng chưa có write consent, kết quả được giữ trong hội thoại và agent hỏi người dùng có muốn tạo/cập nhật spec hay không.
- [ ] AC-005: Một behavioral eval của `project-discovery` kiểm tra tình huống người dùng yêu cầu khám phá nhưng chưa cho phép ghi artifact.
- [ ] AC-006: Validation, trigger eval, unit test và behavioral dry-run của plugin vẫn `PASS` sau thay đổi.
- [ ] AC-007: Không có file hay hành vi thuộc mục đóng gói `.codex/workflows` hoặc cleanup artifact bị thay đổi.

## Ngữ cảnh dự án

- Chỉ dẫn áp dụng: không có `AGENTS.md` hoặc `CLAUDE.md` trong source plugin.
- Mâu thuẫn hiện tại: `skills/controlled-development/SKILL.md` và `skills/change-definition/SKILL.md` yêu cầu write consent; `skills/project-discovery/SKILL.md` mục “Record the discovery result” vẫn yêu cầu Standard/Deep cập nhật `spec.md` và `state.json` vô điều kiện.
- File dự kiến liên quan: `skills/project-discovery/SKILL.md`, `evals/cases/project-discovery.json`; chỉ mở rộng sang test/validator nếu bằng chứng cho thấy cần thiết.
- Lệnh gốc: `node scripts/validate.mjs .`, `node scripts/run-trigger-evals.mjs`, `node --test scripts/validate.test.mjs`, `node scripts/run-behavioral-evals.mjs --all --dry-run`.
- Baseline kiểm tra trước thay đổi: validation `PASS`, trigger eval `24/24`, unit test `27 PASS` và `1 SKIP`, behavioral dry-run lập kế hoạch 26 case.

## Giả định

1. Cụm “sửa mục 2 trước” cho phép tạo đặc tả riêng cho thay đổi đồng bộ này, nhưng không phải là phê duyệt nội dung đặc tả phiên bản 1.
2. Không cần thay đổi schema `state.json` vì đây là quy tắc điều phối trước thao tác ghi, không phải trạng thái workflow mới.

## Phân loại rủi ro

- Yếu tố cao nhất: `medium` do thay đổi hành vi dùng chung giữa orchestrator và phase skill.
- Lý do: phạm vi nhỏ nhưng ảnh hưởng đến thời điểm agent được phép ghi artifact trong mọi workflow Standard/Deep.
- Điều kiện nâng mức: nếu cần đổi state machine, schema hoặc permission model thì phải quay lại phê duyệt đặc tả.

## Ranh giới quyền hạn

- Được phép sau phê duyệt: sửa các file nằm trong kế hoạch được duyệt và chạy kiểm tra cục bộ nêu trên.
- Phải hỏi trước: mở rộng sang đóng gói plugin, cleanup artifact, schema hoặc dependency.
- Tuyệt đối không: commit, push, PR, merge, deploy, production access, real-data mutation.

## Ý định xác minh

| Criterion | Bước kiểm tra dự kiến | Bằng chứng bắt buộc |
|---|---|---|
| AC-001..AC-004 | Kiểm tra nội dung skill và behavioral eval mới | Các câu lệnh rõ ràng, không mâu thuẫn với orchestrator/change-definition |
| AC-005 | `node scripts/run-behavioral-evals.mjs --all --dry-run` | Case mới được tải và đếm thành công |
| AC-006 | Bộ bốn lệnh validation cục bộ | Exit code 0 và kết quả được ghi nhận |
| AC-007 | Kiểm tra changed-file scope | Chỉ các file đã duyệt và artifact của change này thay đổi |

## Câu hỏi còn mở

- Không có.

## Phê duyệt

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: xác nhận “duyệt” trong phiên hiện tại, `2026-09-15T14:34:45+07:00`
- Ghi chú phạm vi được duyệt: chỉ xử lý đồng bộ `project-discovery` với `Specification Write Consent`; mục đóng gói và cleanup artifact giữ ngoài phạm vi.
