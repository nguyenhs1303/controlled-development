# Controlled Development

Controlled Development là một plugin ưu tiên Codex, dùng để phát triển các thay đổi phần mềm với mức tự động hóa cao nhưng luôn nằm trong những ranh giới đã được con người phê duyệt rõ ràng.

Plugin duy trì một agent chính xuyên suốt từ lúc tiếp nhận yêu cầu đến khi review, lưu trạng thái bền vững cho các thay đổi đáng kể, yêu cầu bằng chứng cho mọi tuyên bố hoàn thành, chỉ tự động khắc phục các phát hiện nghiêm trọng nằm trong phạm vi đã duyệt và dừng trước mọi thao tác phát hành.

## Ngôn ngữ

Phần lõi của plugin, gồm chỉ dẫn skill, policy, phase, trạng thái, identifier, lệnh, đường dẫn và schema, được giữ bằng tiếng Anh. Giao tiếp với người dùng và các artifact Markdown được tạo ra mặc định sử dụng tiếng Việt, trừ khi người dùng yêu cầu một ngôn ngữ khác. File machine-readable như `state.json` luôn giữ nguyên key và giá trị schema bằng tiếng Anh.

## Plugin làm gì

```text
BOOTSTRAP -> INTAKE -> DISCOVER -> DEFINE -> SPEC APPROVAL
          -> PLAN -> PLAN APPROVAL (medium/high risk)
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

Skill `controlled-development` điều phối toàn bộ vòng đời. Bạn cũng có thể dùng trực tiếp các skill chuyên biệt cho từng giai đoạn như khám phá dự án, xác định thay đổi, lập kế hoạch, xây dựng, xác minh hoặc review.

Skill `learning-retrospective` có thể dùng trực tiếp khi một thay đổi đã được xác minh và review. Nó phân biệt learning dành cho plugin, learning chỉ dành cho repository, nội dung đã được bao phủ, trường hợp thiếu bằng chứng và trường hợp không có bài học bền vững.

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

Dành cho những thay đổi cục bộ, rõ ràng, rủi ro thấp và có phạm vi ảnh hưởng nhỏ. Phần định nghĩa và kế hoạch có thể ngắn gọn, đồng thời chỉ tồn tại trong cuộc hội thoại hiện tại. Quick vẫn phải xác minh và review thay đổi; nếu quá trình khám phá phát hiện thêm rủi ro hoặc điểm chưa chắc chắn, workflow sẽ nâng lên Standard.

### Standard

Dành cho các tính năng, bản sửa lỗi và hoạt động refactor thông thường cần duy trì ngữ cảnh lâu dài. Standard tạo một bộ hồ sơ thay đổi đầy đủ và yêu cầu phê duyệt đặc tả rõ ràng. Công việc có rủi ro trung bình cũng phải được phê duyệt kế hoạch.

### Deep

Dành cho những thay đổi liên quan đến bảo mật, ảnh hưởng xuyên nhiều thành phần, migration, giao diện công khai, xử lý đồng thời, tài chính hoặc khó hoàn tác. Deep yêu cầu cả hai cổng phê duyệt, chia bước xây dựng nhỏ hơn và cung cấp bằng chứng xác minh chặt chẽ hơn.

Xem [risk-matrix.md](references/risk-matrix.md) để biết các quy tắc định tuyến.

## Các cổng phê duyệt

Mọi profile đều bắt buộc phải được phê duyệt đặc tả. Quick sử dụng một đặc tả ngắn gọn ngay trong cuộc hội thoại; Standard và Deep lưu đặc tả vào bộ artifact của thay đổi. Cổng phê duyệt là điểm kết thúc của lượt làm việc hiện tại: im lặng hoặc tiếp tục trò chuyện không được xem là đã phê duyệt.

Các thay đổi có rủi ro trung bình và cao bắt buộc phải được phê duyệt kế hoạch. Việc phê duyệt chỉ cho phép các thao tác trên working tree cục bộ đã mô tả trong kế hoạch. Nó không cho phép thêm dependency, chạy lệnh có tính phá hủy, tạo tác động bên ngoài hoặc thực hiện phát hành.

Nếu trong lúc triển khai phát hiện phạm vi mới, workflow sẽ quay lại cổng phê duyệt phù hợp.

## Bằng chứng cho quyết định

Plugin phân biệt rõ dữ kiện có bằng chứng, quyết định do người dùng xác nhận, đề xuất và nội dung chưa biết. Một suy luận hợp lý, convention phổ biến, tên file hoặc implementation lân cận không tự trở thành yêu cầu hay quyết định đã được duyệt.

Nếu thiếu hoặc mâu thuẫn bằng chứng có thể làm thay đổi behavior, phạm vi, acceptance criteria, dữ liệu/API, compatibility, kiến trúc, bảo mật, rủi ro, quyền hạn hoặc cách xác minh, Codex phải hỏi một câu tập trung và dừng phase hiện tại. Các chi tiết triển khai cơ học, cục bộ, có thể hoàn tác và không ảnh hưởng những yếu tố trên vẫn được tự quyết theo convention có bằng chứng.

## Artifact của thay đổi

Workflow Standard và Deep tạo các file thông thường, chưa commit trong working tree:

```text
.codex/workflows/changes/<change-id>/
├── spec.md
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

Xem [evidence-policy.md](references/evidence-policy.md), [review-policy.md](references/review-policy.md) và [definition-of-done.md](references/definition-of-done.md).

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
- không bao gồm custom agent, hook, MCP server, tích hợp app hoặc tự động hóa chạy nền;
- nội dung workflow không yêu cầu dependency runtime bên ngoài.

## Kiểm tra trong quá trình phát triển

Chạy bộ kiểm tra xác định và test cục bộ của plugin:

```text
node scripts/validate.mjs
node scripts/run-trigger-evals.mjs
node --test scripts/validate.test.mjs
node scripts/run-behavioral-evals.mjs --all --dry-run
node scripts/validate-learning-retrospective.mjs <candidate-path>
```

Việc thực thi behavioral eval là tùy chọn vì thao tác này gọi Codex và tiêu tốn token của mô hình:

```text
node scripts/run-behavioral-evals.mjs <skill-name>
node scripts/run-behavioral-evals.mjs --all
```

Đồng thời, hãy xác thực package bằng trình kiểm tra plugin của Codex khi có sẵn các dependency Python cần thiết:

```text
python <plugin-creator>/scripts/validate_plugin.py controlled-development
```

Trình xác thực cục bộ kiểm tra các file JSON, frontmatter của skill, liên kết, độ bao phủ của eval case, ví dụ trạng thái và các khả năng tùy chọn bị cấm. Các baseline fixture vẫn chạy bằng lệnh gốc tương ứng. Behavioral runner tạo các workspace tạm thời độc lập, thực thi skill đã chọn thông qua Codex và sử dụng một lượt chấm điểm có cấu trúc riêng biệt. Bất kỳ bước xác thực nào không thể chạy đều phải được báo cáo là `NOT RUN`, không được suy diễn là đã vượt qua.
