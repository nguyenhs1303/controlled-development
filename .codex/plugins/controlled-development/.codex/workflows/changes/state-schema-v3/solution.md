# Thiết kế giải pháp: State schema v3

## Metadata

- Change ID: `state-schema-v3`
- Chế độ: `FULL SOLUTION`
- Tham chiếu đặc tả đã duyệt: `state-schema-v3` spec version 1, được người dùng duyệt bằng thông điệp
  `Duyệt spec state-schema-v3 version 1` ngày 2026-09-18
- Phiên bản giải pháp: `1`

## Bối cảnh quyết định

Đầu việc này cần quyết định cách đưa contract `schemaVersion: 3` vào validator hiện tại mà không làm thay đổi
semantics của schema 1/2, không triển khai sớm controller/state store và không tách transition rules vốn thuộc đầu
việc tiếp theo. Kết quả phải tạo một nguồn contract đủ rõ cho CLI và event ledger về sau, đồng thời giữ phạm vi
triển khai hiện tại nhỏ, có thể kiểm chứng hoàn toàn bằng test cục bộ.

## Bằng chứng và ràng buộc

| Nội dung | Phân loại | Nguồn |
|---|---|---|
| `validateWorkflowState` và các rule liên quan hiện nằm trong một module validator | `EVIDENCED` | `scripts/validate.mjs` |
| Validator hiện hỗ trợ schema 1/2 bằng nhánh version và predecessor table riêng | `EVIDENCED` | `scripts/validate.mjs`, `scripts/validate.test.mjs` |
| Template change mới hiện dùng schema 2 | `EVIDENCED` | `templates/state.json` |
| Fixture state và test unit là cơ chế regression chính cho state contract | `EVIDENCED` | `evals/fixtures/workflow-state/`, `scripts/validate.test.mjs` |
| Schema 3 phải có revision, event anchor và approval binding; schema 1/2 không tự migrate | `USER CONFIRMED` | Spec `state-schema-v3` version 1 đã duyệt |
| CLI, filesystem mutation, event runtime, skill integration và marketplace sync ngoài phạm vi | `USER CONFIRMED` | Spec `state-schema-v3` version 1 đã duyệt |
| Tách transition rules là đầu việc riêng, không thực hiện trong thay đổi này | `USER CONFIRMED` | Checklist nâng cấp và phần Ngoài phạm vi của spec version 1 |
| Không thêm dependency hoặc thay đổi build system | `USER CONFIRMED` | Spec version 1 và ranh giới quyền hạn |

## Decision drivers

| Driver | Mức bắt buộc | Bằng chứng/nguồn |
|---|---|---|
| Schema 3 fail closed khi thiếu hoặc sai revision/event anchor | `MUST` | AC-002, AC-003 |
| Approval schema 3 chỉ hợp lệ khi gắn đúng artifact và digest metadata đầy đủ | `MUST` | AC-004, AC-005 |
| Schema 1/2 giữ nguyên semantics và không bị mutation | `MUST` | AC-007 |
| Schema version tương lai bị từ chối | `MUST` | AC-008 |
| Không lấn sang transition extraction, controller hoặc persistence runtime | `MUST` | AC-010 và Ngoài phạm vi |
| Contract hashing có một reference dùng chung cho các đầu việc sau | `MUST` | AC-006 |
| Diff nhỏ, dễ review và không tạo dependency mới | `SHOULD` | Ranh giới quyền hạn và kiến trúc hiện tại |

## Quality scenarios

| Thuộc tính | Scenario đo được | Trạng thái bằng chứng |
|---|---|---|
| Compatibility | Với fixture schema 1 hoặc 2 hợp lệ, gọi `validateWorkflowState` trả về mảng rỗng và object trước/sau validation deep-equal | `EVIDENCED` bởi test hiện có; cần mở rộng cho cả hai version |
| Integrity | Với từng biến thể schema 3 sai revision, event anchor hoặc approval binding, validator trả ít nhất một lỗi đúng invariant | `HYPOTHESIS` cần unit test mới xác nhận |
| Fail closed | Với `schemaVersion` lớn hơn 3, validator trả lỗi unsupported version và không mutation input | `HYPOTHESIS` cần unit test mới xác nhận |
| Maintainability | Rule chỉ dành cho schema 3 nằm trong helper có tên rõ và chỉ được gọi sau guard `schemaVersion === 3` | `HYPOTHESIS` cần diff review xác nhận |
| Performance | Một state JSON nhỏ được validate bằng kiểm tra field/regex tuyến tính, không thêm I/O hoặc external round-trip | `INFERRED`; không cần benchmark vì không có workload hoặc kiến trúc runtime mới |

Không đặt SLO latency/throughput vì thay đổi chỉ thêm validation deterministic cho một object state nhỏ; số liệu
hiệu năng không ảnh hưởng lựa chọn kiến trúc trong phạm vi đã duyệt.

## Các giải pháp được xem xét

### Option 1: Mở rộng validator hiện hữu bằng helper riêng cho schema 3

- Lý do được xem xét: đây là extension point đang sở hữu toàn bộ state contract và đã có unit test trực tiếp.
- Kiến trúc cấp cao: `validateWorkflowState` tiếp tục điều phối common rules và semantics theo version; helper mới
  kiểm tra revision/event anchor và approval binding chỉ khi `schemaVersion === 3`.
- Pattern/công nghệ: version-gated validation functions; dùng Node.js built-in và regex/constants hiện có, không
  thêm dependency hoặc runtime service.
- Ưu điểm: diff nhỏ; bảo toàn đường gọi hiện tại; test được qua API export hiện có; tránh tạo module boundary trước
  khi transition controller được thiết kế ở đầu việc sau.
- Nhược điểm: `scripts/validate.mjs` tiếp tục lớn hơn; ownership state/transition vẫn cùng module trong thời gian
  ngắn.
- Performance và quality impact: `INFERRED` chi phí chỉ là số hữu hạn kiểm tra scalar/regex; compatibility được
  cô lập bằng version guard và regression test.
- Rủi ro/migration/rollback: không migrate state cũ; rollback là hoàn nguyên schema-3-specific helpers, template,
  reference và fixture/test mới. Rủi ro chính là vô tình áp rule schema 3 lên schema 1/2.
- Bằng chứng và điểm chưa chắc chắn: `EVIDENCED` về extension point và test harness; `HYPOTHESIS` rằng guard/helper
  đủ ngăn regression cho tới khi test được chạy.

### Option 2: Tạo module validator riêng cho schema 3 ngay trong đầu việc này

- Lý do được xem xét: cô lập rule theo version và có thể giảm kích thước `validate.mjs` về lâu dài.
- Kiến trúc cấp cao: `validate.mjs` dispatch sang module mới, module mới sở hữu toàn bộ rule schema 3 hoặc một
  phần rule dùng chung.
- Pattern/công nghệ: strategy/dispatcher theo schema version; không cần dependency mới.
- Ưu điểm: boundary version rõ hơn và thuận lợi nếu schema tiếp tục phát triển độc lập.
- Nhược điểm: phải quyết định sớm ranh giới giữa common, transition và schema rules; dễ trùng hoặc di chuyển
  transition logic thuộc đầu việc 3; tăng số file và surface review trước khi controller architecture được duyệt.
- Performance và quality impact: không có lợi ích runtime có ý nghĩa; maintainability tiềm năng nhưng chưa có
  bằng chứng module boundary này ổn định.
- Rủi ro/migration/rollback: nguy cơ semantic drift do chia common rule giữa hai module; rollback phức tạp hơn
  Option 1.
- Bằng chứng và điểm chưa chắc chắn: `INFERRED`; chưa có contract controller/transition cuối cùng để chứng minh
  boundary module này là đúng.

Không xem JSON Schema hoặc dependency validation mới là option khả thi: invariant phase, profile, approval gate và
quan hệ sequence/hash cần logic ngữ nghĩa; thêm dependency không giải quyết decision driver nào mà còn vượt ranh giới
quyền hạn hiện tại.

## So sánh trade-off

| Tiêu chí | Option 1 | Option 2 | Căn cứ |
|---|---|---|---|
| Đáp ứng toàn bộ invariant schema 3 | `PASS` | `PASS` | Cả hai có thể biểu diễn rule bằng code |
| Bảo toàn semantics schema 1/2 | `HIGH` | `MEDIUM` | Option 1 thêm guard trong đường gọi đã được test; Option 2 phải chia lại ownership |
| Không lấn sang đầu việc transition/controller | `PASS` | `MEDIUM` | Module dispatch mới buộc quyết định boundary sớm |
| Độ nhỏ và khả năng review của diff | `HIGH` | `MEDIUM` | Option 1 sửa extension point hiện có |
| Maintainability dài hạn | `MEDIUM` | `HIGH` | Module riêng có thể tốt hơn sau khi boundary controller ổn định |
| Dependency/technology impact | `LOW` | `LOW` | Cả hai không cần dependency mới |
| Rollback | `HIGH` | `MEDIUM` | Option 1 chỉ thêm rule được guard theo version |

## Giải pháp khuyến nghị

- Option: Option 1 — mở rộng validator hiện hữu bằng helper riêng cho schema 3.
- Lý do: đáp ứng tất cả `MUST` driver với thay đổi nhỏ nhất, giữ đường gọi và test harness hiện tại, đồng thời
  tránh quyết định trước cấu trúc transition/controller của đầu việc 3.
- Phần còn là giả thuyết: version guard và regression test sẽ ngăn schema 3 ảnh hưởng schema 1/2; giả thuyết này
  phải được xác nhận bằng test mutation-free cho cả hai legacy version.
- Phần cần người dùng quyết định: không có câu hỏi material còn mở; solution version 1 cần được duyệt trước PLAN.

## Kiến trúc được đề xuất

- Boundary/component:
  - `scripts/validate.mjs` vẫn là entry point và owner validation trong đầu việc này.
  - `validateWorkflowState` nhận schema 1, 2, 3; common validation tiếp tục dùng chung.
  - Helper schema 3 kiểm tra `revision`, `lastEventSequence`, `lastEventHash` và quan hệ sequence/hash.
  - Approval validator nhận schema version hoặc cờ binding để chỉ kiểm tra metadata mới cho schema 3.
  - `references/workflow-state-schema.md` là nguồn contract dùng chung cho schema compatibility và
    `sha256-text-v1`.
  - `templates/state.json` trở thành mẫu schema 3 cho change mới.
  - Fixture/test hiện tại đại diện current-state behavior chuyển sang schema 3; fixture/test legacy riêng chứng
    minh schema 1/2 vẫn hợp lệ và không mutation.
- Data/runtime flow:
  1. Caller parse JSON như hiện tại và gọi `validateWorkflowState`.
  2. Validator kiểm tra supported version; version ngoài `1|2|3` fail closed.
  3. Common rules kiểm tra field, profile, phase, artifact root, task, baseline và giới hạn remediation.
  4. Schema 1 dùng legacy predecessor/approval semantics; schema 2 và 3 dùng solution workflow semantics.
  5. Chỉ schema 3 chạy integrity-field helper và approval-binding helper.
  6. Validator trả danh sách lỗi, không ghi file và không mutate object input.
- Architectural/design pattern: version-gated validation. Pattern này giải quyết compatibility song song giữa
  ba schema với chi phí là một số branch rõ ràng; chưa thêm dispatcher/module vì boundary đó thuộc thiết kế
  controller/transition sau này.
- C4/dynamic/deployment view: không áp dụng; thay đổi chỉ nằm trong một process local validator và không có
  container, network hoặc deployment boundary mới.

### Chi tiết contract triển khai

- Supported versions là `1`, `2`, `3`; error message phải thể hiện tập version được hỗ trợ hoặc unsupported future
  version một cách fail closed.
- Schema 3 required fields bổ sung: `revision`, `lastEventSequence`, `lastEventHash`.
- `revision` và `lastEventSequence` dùng `Number.isInteger` và phải `>= 0`.
- `lastEventSequence === 0` yêu cầu `lastEventHash === null`; sequence `> 0` yêu cầu regex
  `^sha256:[0-9a-f]{64}$`.
- Mapping gate/artifact cố định: `spec -> spec.md`, `solution -> solution.md`, `plan -> plan.md`.
- Với approval schema 3 `pending`, `artifactPath`, `digestAlgorithm`, `artifactDigest`, `approvedAt` đều phải
  `null`; `reference` tiếp tục theo semantics hiện tại.
- Với approval schema 3 `approved`, `reference` phải non-empty, `artifactPath` phải khớp mapping,
  `digestAlgorithm === sha256-text-v1`, digest khớp regex và `approvedAt` là ISO timestamp hợp lệ.
- Validator chỉ kiểm tra metadata shape; không đọc artifact và không tự tính digest trong đầu việc này.
- Validation phải quan sát thuần túy: test snapshot/deep-equal input trước và sau cho schema 1, 2, 3.

## Công nghệ và dependency

| Thay đổi | Loại | Lý do | Permission |
|---|---|---|---|
| Node.js built-in APIs hiện có | `change` | Thêm scalar/regex validation trong module hiện tại | `NOT REQUIRED` |
| `references/workflow-state-schema.md` | `new` | Nguồn contract chung cho validator và CLI sau này | `NOT REQUIRED` |
| Dependency bên thứ ba | `none` | Không cần để đáp ứng contract | `NOT REQUIRED` |
| Build/CI/public interface | `none` | Ngoài phạm vi đầu việc | `NOT REQUIRED` |

## Verification conditions

| Claim/driver | Cách xác minh | Kết quả cần quan sát |
|---|---|---|
| Template schema 3 hợp lệ | Unit test và `node scripts/validate.mjs` | Template có giá trị khởi tạo và approval pending metadata đúng contract |
| Integrity fields fail closed | Table-driven tests với từng invalid variant | Mỗi variant trả lỗi đúng field/invariant; valid schema 3 trả mảng rỗng |
| Approval binding chính xác | Test pending, approved, wrong artifact, algorithm, digest và timestamp | Chỉ record đúng gate và metadata đầy đủ được chấp nhận |
| Schema 1/2 compatibility | Fixture riêng; deep clone trước validation | Cả hai trả mảng rỗng và input deep-equal sau validation |
| Future version rejection | Test `schemaVersion: 4` | Validator trả lỗi và không mutation |
| Contract hashing đầy đủ | Test đọc reference và kiểm tra các marker BOM, CRLF, lone CR, whitespace, trailing newline, Unicode normalization, invalid UTF-8, output | Tất cả thành phần contract AC-006 hiện diện |
| Không vượt phạm vi | Diff review | Không có CLI, state store, event runtime, skill integration hoặc marketplace file |
| Regression tổng thể | `node --test scripts/validate.test.mjs`; `node scripts/validate.mjs`; `node scripts/run-trigger-evals.mjs`; plugin validator | Tất cả command exit 0 |

## Consequences và technical debt

- Tích cực: schema 3 có contract xác định, backward compatibility có test, và các đầu việc CLI/controller có một
  reference thống nhất để sử dụng.
- Tiêu cực: `validate.mjs` tiếp tục chứa cả orchestration và state rule trong đầu việc này.
- Technical debt chấp nhận: chưa tách transition rules hoặc schema dispatcher; xử lý trong đầu việc 3 sau khi
  contract schema 3 ổn định và được kiểm chứng.

## Migration và rollback

- Không có migration runtime. File schema 1/2 tiếp tục được validate theo semantics hiện tại và không được tự ghi
  lại.
- Change mới tạo từ template sẽ dùng schema 3 sau khi đầu việc hoàn tất.
- Nếu cần rollback trước khi controller được triển khai, hoàn nguyên template/reference/schema-3 helpers và
  fixture/test tương ứng; state legacy không cần phục hồi vì chưa bị mutate.
- Nếu đầu việc sau cần ghi schema legacy, quyền và chiến lược migration phải quay lại solution design của
  controller/state-store; solution này không cấp quyền ghi đó.

## Revisit conditions

- Controller yêu cầu semantics revision khác số nguyên đơn điệu bắt đầu từ `0`.
- Event ledger yêu cầu anchor khác `lastEventSequence`/`lastEventHash` hoặc thuật toán hash khác SHA-256.
- Cần tự động migrate hoặc ghi lại state schema 1/2.
- Approval cần nhiều artifact, artifact ngoài Markdown hoặc canonicalization khác `sha256-text-v1`.
- Schema-specific rules làm `validate.mjs` khó cô lập hoặc transition extraction ở đầu việc 3 chứng minh cần
  dispatcher/module boundary khác.
- Xuất hiện dependency, public interface, CI/build hoặc filesystem mutation chưa được duyệt.

## Câu hỏi còn mở

- Không có câu hỏi material. Các chi tiết tên helper và cách nhóm test là lựa chọn triển khai cục bộ, có thể đảo
  ngược và không thay đổi contract.

## Phê duyệt giải pháp

- Quyết định: `APPROVED`
- Người phê duyệt: người dùng
- Tham chiếu/thời gian: `duyệt` — phê duyệt solution `state-schema-v3` version 1 được trình bày ngay trước đó,
  ngày 2026-09-18
- Ghi chú: phê duyệt solution không cấp quyền mở rộng sang CLI, controller, state store, event runtime, skill
  integration hoặc marketplace sync
