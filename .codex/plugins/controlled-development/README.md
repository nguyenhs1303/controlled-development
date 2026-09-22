# Controlled Development

Controlled Development là một plugin ưu tiên Codex, dùng để phát triển các thay đổi phần mềm với mức tự động hóa cao nhưng luôn nằm trong những ranh giới đã được con người phê duyệt rõ ràng.

Plugin duy trì một agent chính xuyên suốt từ lúc tiếp nhận yêu cầu đến khi review, lưu trạng thái bền vững cho các thay đổi đáng kể, yêu cầu bằng chứng cho mọi tuyên bố hoàn thành, chỉ tự động khắc phục các phát hiện nghiêm trọng nằm trong phạm vi đã duyệt và dừng trước mọi thao tác phát hành.

## Ngôn ngữ

Phần lõi của plugin, gồm chỉ dẫn skill, policy, phase, trạng thái, identifier, lệnh, đường dẫn và schema, được giữ bằng tiếng Anh. Giao tiếp với người dùng và các artifact Markdown được tạo ra mặc định sử dụng tiếng Việt, trừ khi người dùng yêu cầu một ngôn ngữ khác. File machine-readable như `state.json` luôn giữ nguyên key và giá trị schema bằng tiếng Anh.

## Plugin làm gì

```text
BOOTSTRAP -> INTAKE -> DISCOVER -> TRIAGE
          -> Quick: skip DEFINE/SOLUTION/PLAN
          -> Standard/Deep: DEFINE -> SPEC APPROVAL
                            -> SOLUTION DESIGN -> SOLUTION APPROVAL
                            -> PLAN -> PLAN APPROVAL (Deep hoặc execution nhạy cảm)
          -> BUILD -> VERIFY -> REVIEW
          -> [AUTO-REMEDIATE -> RE-VERIFY -> RE-REVIEW] x3 maximum
          -> LEARNING RETROSPECTIVE
          -> FINAL REPORT -> STOP
```

Vòng lặp khắc phục trong ngoặc vuông chỉ chạy đối với các phát hiện Critical hoặc Important có bằng chứng và nằm trong phạm vi đã được phê duyệt. Sau một review sạch, plugin đánh giá xem thay đổi có tạo ra bài học workflow bền vững hay không. Bước này chỉ tạo proposal, không tự sửa plugin.

## Plugin tuyệt đối không làm gì

Controlled Development tuyệt đối không:

- đưa file vào staging hoặc commit;
- push branch hoặc tag;
- tạo hoặc cập nhật pull request;
- merge, release hoặc deploy;
- truy cập hoặc thay đổi hệ thống production;
- sửa đổi dữ liệu thật của khách hàng hoặc người dùng;
- làm yếu test hoặc cơ chế bảo vệ để đạt kết quả vượt qua kiểm tra.

Workflow kết thúc sau báo cáo review cuối cùng.

## Cơ chế kích hoạt

Plugin là một gói các khả năng, không phải một lệnh tự chạy. Codex đối chiếu yêu cầu của bạn với phần mô tả skill trong plugin rồi tải các chỉ dẫn phù hợp.

Ví dụ prompt thường dùng:

```text
Develop this feature with controlled approvals and stop after review.
```

```text
Resume the controlled development change account-lockout.
```

```text
Review this implementation against the approved spec and remediate serious in-scope findings.
```

Skill `controlled-development` điều phối toàn bộ vòng đời. Bạn cũng có thể dùng trực tiếp các skill chuyên biệt
cho từng giai đoạn như khám phá dự án, xác định thay đổi, thiết kế giải pháp, lập kế hoạch, xây dựng, xác minh
hoặc review.

Skill `solution-design` chạy sau khi đặc tả Standard/Deep được duyệt và trước implementation planning. Skill
xác định decision drivers, quality scenario đo được, các option thực sự khả thi, trade-off, recommendation,
kiến trúc, design/architectural pattern, công nghệ/dependency, performance, verification và revisit condition,
sau đó dừng để người dùng duyệt giải pháp.

Skill `learning-retrospective` có thể dùng trực tiếp khi một thay đổi đã được xác minh và review. Nó phân biệt learning dành cho plugin, learning chỉ dành cho repository, nội dung đã được bao phủ, trường hợp thiếu bằng chứng và trường hợp không có bài học bền vững.

Skill explicit-only `repository-bootstrap` dùng sau khi copy starter kit `.codex/` và `AGENTS.md` vào một
repository mới. Gọi `$repository-bootstrap` để tạo trạng thái resumable, khám phá manifest/CI/code bằng bằng
chứng, hỏi lại các dữ kiện quan trọng còn thiếu, cập nhật repository instruction và chạy validator. Skill này
không tự chạy trong feature workflow và không sửa product source.

Trong cùng một task, chỉ cần gọi một lần. Nếu Codex hỏi thêm dữ kiện, trả lời trực tiếp; câu trả lời tự tiếp tục
bootstrap đang hoạt động. Chỉ gọi lại khi chuyển sang task mới, task trước bị gián đoạn/mất context, hoặc muốn
audit một bootstrap đã hoàn tất.

```text
$repository-bootstrap
```

Ví dụ theo từng profile:

```text
Quick: Correct this local validation message, run its focused test, review it, and stop.
```

```text
Standard: Add CSV export with a written spec, approval gate, durable artifacts, verification, and review.
```

```text
Deep: Change authorization rules using both approval gates and strong security-focused evidence.
```

Ví dụ kết quả bị chặn:

```text
Resume change authorization-rules. If the same blocker exhausts three distinct attempts, produce IMPLEMENTATION BLOCKED with evidence and stop.
```

## Các profile workflow

### Quick

Dành cho những thay đổi cục bộ, rõ ràng, rủi ro thấp và có phạm vi ảnh hưởng nhỏ. Quick bỏ qua spec/solution
artifact và đi từ triage có bằng chứng vào triển khai trong phạm vi yêu cầu rõ ràng của người dùng. Quick vẫn
phải xác minh và review; nếu phát hiện thêm rủi ro hoặc quyết định material, workflow nâng lên Standard/Deep.
Số dòng code không quyết định profile.

### Standard

Dành cho các tính năng, bản sửa lỗi và hoạt động refactor thông thường cần duy trì ngữ cảnh lâu dài. Standard
tạo bộ artifact đầy đủ, yêu cầu phê duyệt đặc tả và `SOLUTION LITE`. Plan approval chỉ tách riêng khi execution
nhạy cảm, khó hoàn tác, permission-gated hoặc project policy yêu cầu.

### Deep

Dành cho những thay đổi liên quan đến bảo mật, ảnh hưởng xuyên nhiều thành phần, migration, giao diện công khai,
xử lý đồng thời, tài chính hoặc khó hoàn tác. Deep yêu cầu phê duyệt đặc tả, `FULL SOLUTION` và plan, chia bước
xây dựng nhỏ hơn và cung cấp bằng chứng xác minh chặt chẽ hơn.

Xem [risk-matrix.md](references/policies/risk-matrix.md) để biết các quy tắc định tuyến.

## Các cổng phê duyệt

Quick không có cổng spec/solution riêng khi triage chứng minh mọi yếu tố đều Low. Standard và Deep lưu đặc tả
và solution vào bộ artifact, đồng thời yêu cầu phê duyệt riêng cho đúng version. Cổng phê duyệt là điểm kết thúc
của lượt làm việc hiện tại: im lặng hoặc tiếp tục trò chuyện không được xem là đã phê duyệt.

Deep và các plan có execution nhạy cảm bắt buộc được phê duyệt kế hoạch. Việc phê duyệt solution hoặc plan chỉ
cho phép các thao tác working tree cục bộ đã trình bày; không tự cho phép thêm dependency, migration, chạy lệnh
phá hủy, tạo tác động bên ngoài hoặc phát hành.

Nếu trong lúc triển khai phát hiện phạm vi mới, workflow sẽ quay lại cổng phê duyệt phù hợp.

## Bằng chứng cho quyết định

Plugin phân biệt rõ dữ kiện có bằng chứng, quyết định do người dùng xác nhận, đề xuất và nội dung chưa biết. Một suy luận hợp lý, convention phổ biến, tên file hoặc implementation lân cận không tự trở thành yêu cầu hay quyết định đã được duyệt.

Nếu thiếu hoặc mâu thuẫn bằng chứng có thể làm thay đổi behavior, phạm vi, acceptance criteria, dữ liệu/API, compatibility, kiến trúc, bảo mật, rủi ro, quyền hạn hoặc cách xác minh, Codex phải hỏi một câu tập trung và dừng phase hiện tại. Các chi tiết triển khai cơ học, cục bộ, có thể hoàn tác và không ảnh hưởng những yếu tố trên vẫn được tự quyết theo convention có bằng chứng.

## Artifact của thay đổi

Workflow Standard và Deep tạo các file thông thường, chưa commit trong working tree:

```text
.codex/workflows/changes/<change-id>/
├── spec.md
├── solution.md
├── plan.md
├── tasks.md
├── state.json
├── evidence.md
├── final-review.md
└── learning-retrospective.md  # chỉ tạo khi có PLUGIN CANDIDATE
```

Plugin không bao giờ chạy `git add`, `git commit` hoặc chỉnh sửa `.gitignore`. Chỉ dẫn của dự án có thể quy định một đường dẫn artifact an toàn khác nằm trong dự án hoặc một hệ thống theo dõi bên ngoài. Đường dẫn hệ thống file không mặc định phải kết thúc bằng change ID và ghi tham chiếu phê duyệt cho ngoại lệ đó trong `state.json`; đường dẫn tuyệt đối và việc duyệt ngược bằng `..` sẽ bị từ chối theo nguyên tắc fail closed. Workflow Quick thường không tạo thư mục artifact.

## Learning retrospective

Retrospective chỉ chạy sau khi verification thành công và cả hai review không còn phát hiện Critical hoặc Important. Thay đổi bị `IMPLEMENTATION BLOCKED` hoặc `REVIEW BLOCKED` sẽ bỏ qua bước này và ghi rõ lý do.

Retrospective dùng spec, plan, task outcome, verification receipt, review finding, diff cuối và quyết định rõ ràng của người dùng làm bằng chứng. Nó không dùng độ khó, thời gian thực hiện, suy luận của model hoặc việc người dùng không phản đối để kết luận rằng plugin cần thay đổi.

Kết quả là đúng một trong các loại:

- `PLUGIN CANDIDATE`: bài học workflow có bằng chứng, có phạm vi áp dụng và có eval đề xuất;
- `REPOSITORY LEARNING`: bài học chỉ đúng với domain hoặc convention của repository hiện tại;
- `ALREADY COVERED`: plugin hiện tại đã bao phủ đầy đủ;
- `NEEDS MORE EVIDENCE`: chưa đủ bằng chứng để xác định nguyên nhân, phạm vi hoặc cách kiểm chứng;
- `NO DURABLE LEARNING`: không có bài học đủ giá trị để lưu lâu dài.

Mỗi change tạo tối đa một `PLUGIN CANDIDATE`. Candidate luôn có trạng thái `proposed`, được kiểm tra cấu trúc và không cấp quyền sửa plugin. Nếu người dùng phê duyệt candidate, việc áp dụng phải bắt đầu như một controlled change mới đối với source plugin, đi qua các cổng phê duyệt và eval thông thường.

## Cơ chế tiếp tục công việc

Để tiếp tục, hãy yêu cầu Codex resume một change ID cụ thể. BOOTSTRAP đọc chỉ dẫn của dự án, xác thực `state.json` đã lưu, kiểm tra Git baseline được ghi nhận và chỉ tiếp tục từ một bước chuyển trạng thái hợp lệ.

Từ state schema 3, mọi approval và phase transition đi qua `scripts/runtime/workflow-controller.mjs`. Các lệnh đọc-only
gồm `status`, `validate-state`, `check-resume`, `hash-artifact`; các lệnh ghi gồm `approve`, `transition` và
`record`, đều yêu cầu `--expected-revision`. Controller dùng lock file, atomic replace và immutable event hash
chain; agent không tự sửa phase, approval, revision hoặc event anchor trong `state.json`.

Trạng thái sai định dạng, phiên bản schema thuộc tương lai, thiếu phê duyệt bắt buộc hoặc baseline bị thay đổi mà không có giải thích đều bị từ chối theo nguyên tắc fail closed. Thay vì tự suy đoán và chuyển sang BUILD, agent sẽ báo cáo những nội dung cần được đối chiếu và xử lý.

## Bằng chứng và kết quả cuối cùng

Quá trình xác minh sử dụng bốn trạng thái:

- `PASS`: bước kiểm tra thực sự đã chạy thành công và có biên nhận;
- `FAIL`: bước kiểm tra thực sự đã chạy và thất bại;
- `NOT RUN`: bước kiểm tra chưa được thực thi và có ghi rõ lý do;
- `UNVERIFIED`: bằng chứng chưa đủ để chứng minh cho tuyên bố.

Báo cáo cuối cùng kết thúc bằng chính xác một trong các trạng thái sau:

- `REVIEW PASSED`
- `REVIEW BLOCKED`
- `IMPLEMENTATION BLOCKED`

Xem [evidence-policy.md](references/policies/evidence-policy.md), [review-policy.md](references/policies/review-policy.md) và [definition-of-done.md](references/policies/definition-of-done.md).

## Giới hạn phục hồi

- Chỉ được thực hiện tối đa ba lần thử khác nhau về bản chất cho cùng một blocker.
- Chỉ được chạy tối đa ba chu kỳ review-khắc phục hoàn chỉnh.
- Mỗi lần thử lại phải dựa trên một giả thuyết đã thay đổi; chạy lại nguyên lệnh đang thất bại không được xem là có tiến triển.
- Khi chạm một trong hai giới hạn, workflow tạo trạng thái cuối bị chặn, kèm bằng chứng và hành động được đề xuất cho con người.

## Thiết kế V1

V1 được chủ đích thiết kế độc lập với ngôn ngữ lập trình và chỉ sử dụng một agent:

- các lệnh gốc của dự án được khám phá từ manifest, wrapper, CI và tài liệu;
- một agent chính duy trì đầy đủ ngữ cảnh ra quyết định;
- các skill review riêng biệt cung cấp góc nhìn về đặc tả và kỹ thuật;
- một skill retrospective riêng đánh giá learning sau review nhưng không tự sửa plugin;
- không bao gồm custom agent, MCP server, tích hợp app hoặc tự động hóa chạy nền; hook đồng bộ chỉ thực thi
  controller policy đã duyệt và không chạy nền;
- nội dung workflow không yêu cầu dependency runtime bên ngoài.

## Cấu trúc package

Plugin dùng root `plugin.json` làm portable Agent Plugins manifest và giữ `.codex-plugin/plugin.json` làm compatibility overlay cho các Codex host cũ. Validator bắt buộc hai manifest có cùng identity, version và OpenAI interface metadata.

```text
controlled-development/
├── plugin.json
├── .codex-plugin/plugin.json
├── hooks/
│   ├── hooks.json
│   └── run-hook.mjs
├── skills/
├── references/
│   ├── policies/
│   └── schemas/
├── assets/workflow-templates/
├── scripts/
│   ├── runtime/
│   └── validators/
├── tests/
│   ├── unit/
│   └── fixtures/
└── evals/
    ├── cases/
    └── runners/
```

`scripts/runtime/` chỉ chứa controller, state validation và các module cần khi workflow chạy. Package validation và retrospective validation nằm trong `scripts/validators/`; test và eval tooling không thuộc runtime boundary.

## Hooks, cachebuster và trust

`hooks/hooks.json` maps `SessionStart`, `PreToolUse`, `PostToolUse`, and `Stop` to the bundled synchronous
adapter. The adapter is intentionally thin; authorization comes from the controller and schema-4
`execution-policy.json`. The catch-all PreToolUse/PostToolUse mappings are required so an unknown local tool cannot
silently bypass an active workflow. With no active binding, hooks emit a deterministic no-op.

After changing a bundled hook or manifest, use the host's documented plugin reinstall/cachebuster flow and review
the hook bundle before trusting it. Installing, reinstalling, or trusting a plugin in user scope is an explicit
permission-gated action for this change; package validation does not prove live trust. If that action is not
authorized or host execution is not observed, report live enforcement as `NOT RUN`/`UNVERIFIED`, never `PASS`.

## Kiểm tra trong quá trình phát triển

Chạy bộ kiểm tra xác định và test cục bộ của plugin:

```text
node scripts/validators/validate-plugin.mjs
node evals/runners/run-trigger-evals.mjs
node --test tests/unit/validate-plugin.test.mjs
node --test tests/unit/workflow-rules.test.mjs
node --test tests/unit/workflow-controller.test.mjs
node evals/runners/run-behavioral-evals.mjs --all --dry-run
node scripts/validators/validate-learning-retrospective.mjs <candidate-path>
```

Việc thực thi behavioral eval là tùy chọn vì thao tác này gọi Codex và tiêu tốn token của mô hình. Runner bắt
buộc chọn phạm vi rõ ràng; khi sửa plugin thông thường, ưu tiên impact-based selection:

```text
node evals/runners/run-behavioral-evals.mjs --changed
node evals/runners/run-behavioral-evals.mjs <skill-name>
node evals/runners/run-behavioral-evals.mjs --all
```

Chỉ dùng `--all` trước release, sau thay đổi runner/schema dùng chung, trong lượt chạy định kỳ hoặc khi được yêu
cầu rõ ràng. Gọi runner mà không chọn phạm vi sẽ dừng trước khi gọi model.

Đồng thời, hãy xác thực package bằng trình kiểm tra plugin của Codex khi có sẵn các dependency Python cần thiết:

```text
python <plugin-creator>/scripts/validate_plugin.py .
```

Trình xác thực cục bộ kiểm tra các file JSON, frontmatter của skill, liên kết, độ bao phủ của eval case, ví dụ trạng thái và các khả năng tùy chọn bị cấm. Các baseline fixture vẫn chạy bằng lệnh gốc tương ứng. Behavioral runner tạo các workspace tạm thời độc lập, thực thi skill đã chọn thông qua Codex và sử dụng một lượt chấm điểm có cấu trúc riêng biệt. Bất kỳ bước xác thực nào không thể chạy đều phải được báo cáo là `NOT RUN`, không được suy diễn là đã vượt qua.

