# Behavioral mismatch triage

## Phạm vi

Tài liệu này ghi lại triage từ baseline 19/48 đến baseline hiện hành 45/48, dùng bốn nhãn bắt buộc: `CASE_DEFECT`, `GRADER_DEFECT`, `SKILL_DEFECT`, `MODEL_VARIANCE`.

## Tổng hợp

| Nhãn | Kết luận |
|---|---|
| `CASE_DEFECT` | Nhiều case dialogue yêu cầu command/file mutation không thể quan sát; prompt thiếu evidence; fixture phụ thuộc PATH/Git; một số expectation dùng thứ tự hoặc wording chặt hơn policy. Đã sửa trong case definitions và fixture portable. |
| `GRADER_DEFECT` | Regex của `change-verification:2` ghép status với subject quá hẹp. Đã sửa detector và giữ nguyên status safeguard. |
| `SKILL_DEFECT` | Không tìm thấy defect có bằng chứng ổn định trong skill source. Không sửa skill để ép suite xanh. |
| `MODEL_VARIANCE` | Một số semantic expectation PASS ở targeted/full run này nhưng FAIL ở full run khác với cùng contract. Baseline cuối có hai case variance: `controlled-development:1`, `spec-compliance-review:2`. |

## Environment

- Preflight `read-only`: PASS.
- Preflight `workspace-write`: PASS.
- Execution rerun sau remediation: `9/9 PASS`.
- Full run cuối: `0/48` case có sandbox/helper failure.
- Lỗi `codex-windows-sandbox-setup.exe` trong baseline cũ không còn tái hiện.

## Remediation nổi bật

- Thêm `--kind dialogue|execution` và repeatable `--case <skill>:<id>`.
- Thêm portable `tests/fixtures/verification-status/`, không phụ thuộc Python/mypy trên PATH.
- Làm rõ dialogue-only contracts để không yêu cầu persistence/command không thể quan sát.
- Bổ sung evidence trực tiếp cho approval, planning, clean review và repository-bootstrap cases.
- Tách remediation eligibility khỏi việc thực thi remediation trong engineering review.
- Làm rõ `SOLUTION LITE` có thể nêu ngắn gọn exclusion nhưng không trình bày unsupported alternatives như lựa chọn ngang hàng.
- Bắt end-to-end final response nêu retrospective classification và `pluginMutation: none`.
- Bắt resume fixture final response nêu recorded baseline values và đánh dấu live comparison `NOT RUN`.

## Stability evidence

- 9 execution cases: một batch hiện hành `9/9 PASS`.
- Bốn case từng dao động (`change-definition:1`, `engineering-review:1`, `implementation-planning:3`, `spec-compliance-review:3`): confirmation batch `4/4 PASS`.
- Các case được harden sau full run đều có hai exact PASS liên tiếp trước khi kết thúc remediation.
- Full run cuối vẫn `45/48`, cho thấy exact-case stability không loại bỏ hoàn toàn variance khi chạy tuần tự toàn suite.

## Kết luận

Không còn environment blocker và không có `SKILL_DEFECT` đã chứng minh. Residual risk là semantic model/grader variance, vì vậy không nên biến một full live run đơn lẻ thành hard release gate cho đến khi có retry/quorum hoặc deterministic coverage thay thế cho các expectation phù hợp.
