# Thiết kế giải pháp: Chuẩn hóa cấu trúc portable plugin

## Metadata

- Change ID: `portable-plugin-layout`
- Chế độ: `SOLUTION LITE`
- Tham chiếu đặc tả đã duyệt: xác nhận của người dùng trong session 2026-09-19
- Phiên bản giải pháp: `v1`

## Bối cảnh quyết định

Plugin hiện có compatibility manifest và các boundary chức năng hợp lệ, nhưng runtime code, package validator, test và eval runner đang dùng chung `scripts/`; template chưa nằm trong `assets/`; mọi skill phụ thuộc mạnh vào relative path. Giải pháp phải chuyển sang portable layout mà vẫn giữ host compatibility và workflow behavior.

## Bằng chứng và ràng buộc

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| Portable plugin dùng root `plugin.json`; overlay cũ là fallback | `EVIDENCED` | OpenAI Docs `plugins/build/plugins` |
| Portable skill discovery dùng root `skills/` | `EVIDENCED` | OpenAI Docs `plugins/build/plugins` và `plugins/build/skills` |
| Controller hiện import `validateWorkflowState` từ package validator | `EVIDENCED` | `scripts/workflow-controller-core.mjs`, `scripts/validate.mjs` |
| Mọi skill dùng root shared policy/template qua relative path | `EVIDENCED` | `skills/*/SKILL.md` |
| Không thêm dependency hoặc thay workflow behavior | `USER CONFIRMED` | scope tám bước đã duyệt |

## Decision drivers

| Driver | Mức bắt buộc | Bằng chứng/nguồn |
|---|---|---|
| Portable packaging theo OpenAI Docs | `MUST` | AC-001 |
| Backward compatibility trong chu kỳ hiện tại | `MUST` | AC-002 |
| Runtime không phụ thuộc package/eval validator | `MUST` | AC-006 |
| Path migration phải được kiểm tra tự động | `MUST` | AC-004, AC-005, AC-007 |
| Không đổi semantics workflow | `MUST` | phạm vi/non-goal đã duyệt |
| Boundary dễ hiểu cho maintainer | `SHOULD` | AC-003 |

## Quality scenarios

| Thuộc tính | Scenario đo được | Trạng thái bằng chứng |
|---|---|---|
| Compatibility | Cả root manifest và compatibility manifest vượt validator, có cùng name/version/interface | `EVIDENCED` qua test |
| Reliability | Full native test matrix sau migration có exit code 0 | `EVIDENCED` qua execution |
| Maintainability | Runtime controller chỉ import module dưới `scripts/runtime/` | `EVIDENCED` qua source assertion |

## Các giải pháp được xem xét

### Option 1: Portable root manifest + compatibility overlay + boundary migration

- Lý do được xem xét: trực tiếp đáp ứng tài liệu OpenAI và giữ khả năng chạy trên host cũ.
- Kiến trúc cấp cao: portable identity ở root; OpenAI metadata được đồng bộ ở root extension và compatibility overlay; runtime/dev/test/eval được tách theo trách nhiệm.
- Pattern/công nghệ: compatibility adapter ở manifest; dependency boundary bằng thư mục; không thêm công nghệ.
- Ưu điểm: migration tăng dần, rollback cục bộ, validator có thể chứng minh consistency.
- Nhược điểm: tạm thời duy trì hai manifest và cần kiểm tra drift.
- Performance và quality impact: không thay runtime workload; chỉ thay path/module loading.
- Rủi ro/migration/rollback: link/import cũ có thể sót; được giảm bằng validator, tests và search.
- Bằng chứng và điểm chưa chắc chắn: `EVIDENCED`; không có material unknown.

Không chọn phương án xóa ngay compatibility manifest vì trái yêu cầu tương thích an toàn. Không chọn giữ nguyên layout vì không đạt mục tiêu portable packaging và boundary separation.

## So sánh trade-off

| Tiêu chí | Option 1 | Căn cứ |
|---|---|---|
| Portable compliance | `PASS` | root manifest theo schema chính thức |
| Backward compatibility | `PASS` | giữ compatibility overlay |
| Migration risk | `MEDIUM` | nhiều path nhưng có automated coverage |
| Dependency impact | `LOW` | không thêm dependency |

## Giải pháp khuyến nghị

- Option: Portable root manifest + compatibility overlay + boundary migration.
- Lý do: đây là lựa chọn duy nhất đáp ứng đồng thời portable packaging, compatibility và tách runtime/dev tooling mà không đổi semantics.
- Phần còn là giả thuyết: không có material hypothesis; plugin-creator validator availability phụ thuộc Python environment và sẽ được ghi `NOT RUN` nếu thiếu.
- Phần cần người dùng quyết định: không có.

## Kiến trúc được đề xuất

- Boundary/component: `skills/`; `references/{policies,schemas}`; `assets/workflow-templates`; `scripts/{runtime,validators}`; `tests/{unit,fixtures}`; `evals/{cases,runners}`.
- Data/runtime flow: skill gọi runtime controller hoặc focused validator bằng path mới; development validator kiểm tra toàn package và import state validator runtime.
- Architectural/design pattern: compatibility overlay để hỗ trợ host cũ; separation by responsibility để runtime không kéo test/eval concerns.
- C4/dynamic/deployment view: không áp dụng theo yêu cầu người dùng và không cần thiết cho quyết định cục bộ này.

## Công nghệ và dependency

| Thay đổi | Loại | Lý do | Permission |
|---|---|---|---|
| Không có dependency mới | none | Chỉ dùng Node/Python tool hiện hữu | `NOT REQUIRED` |

## Verification conditions

| Claim/driver | Cách xác minh | Kết quả cần quan sát |
|---|---|---|
| Manifest portable và overlay nhất quán | package validator + plugin validator | exit 0 |
| Runtime boundary độc lập | unit tests + source assertions | controller chạy và test pass |
| Path migration đầy đủ | link validator + search path cũ | không còn stale reference ngoài history artifacts |
| Behavior giữ nguyên | trigger eval + behavioral dry-run | toàn bộ cases pass |

## Consequences và technical debt

- Tích cực: package phù hợp hướng portable mới; ownership thư mục rõ; runtime path nhỏ hơn.
- Tiêu cực: hai manifest cần đồng bộ trong giai đoạn compatibility.
- Technical debt chấp nhận: compatibility manifest chỉ được bỏ trong một change riêng sau khi support matrix cho phép.

## Revisit conditions

- OpenAI ngừng hỗ trợ `.codex-plugin/plugin.json` hoặc repository quyết định bỏ host cũ.
- Plugin thêm MCP, hooks hoặc app integration và cần mở rộng portable manifest.
- Packaging tooling cung cấp cơ chế exclude dev artifacts chính thức.

## Câu hỏi còn mở

- Không có.

## Phê duyệt giải pháp

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: xác nhận toàn bộ phương án tám bước trong session 2026-09-19
- Ghi chú: không thêm sơ đồ, dependency, marketplace hoặc shipping action.
