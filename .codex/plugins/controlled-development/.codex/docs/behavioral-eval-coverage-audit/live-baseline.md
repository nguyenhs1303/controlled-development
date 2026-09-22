# Full live behavioral baseline

## Kết quả hiện hành

- Thời điểm: 2026-09-21, khoảng 17:03 (Asia/Bangkok).
- Suite: 48 case; 39 dialogue và 9 execution.
- Process exit: `1` vì full run có 3 case FAIL.
- PASS: `45/48` (93.75%).
- FAIL: `3/48` (6.25%).
- Dialogue: `37/39 PASS`.
- Execution: `8/9 PASS`.
- Sandbox/helper failure: `0/48`; lỗi `codex-windows-sandbox-setup.exe` cũ không tái hiện.
- Model calls: `95` = 48 executor + 47 grader.
- Grader skipped: 1 case (`change-verification:2`) vì deterministic checks giải quyết đủ expectation.

## Token usage do runner tổng hợp từ Codex JSONL

| Chỉ số | Tổng |
|---|---:|
| Input tokens | 5,951,600 |
| Cached input tokens | 4,442,368 |
| Output tokens | 88,685 |
| Reasoning output tokens | 35,671 |

`cached input` và `reasoning output` là phần con do CLI báo riêng; không cộng lần nữa vào input/output.

## Chi phí tham chiếu

- Uncached input: 1,509,232 tokens.
- OpenAI API Standard base-rate equivalent: khoảng **$9.59 USD** với đơn giá tham chiếu `$4/M` uncached input, `$0.40/M` cached input và `$20/M` output.
- Con số $9.59 chưa áp long-context multiplier theo từng request vì full run này chỉ lưu aggregate usage, không lưu usage breakdown cho từng call.
- Chi phí thực tế: `UNVERIFIED`, vì CLI dùng provider tùy chỉnh `my_provider`; provider có thể dùng subscription hoặc billing contract khác OpenAI API Standard.

## Ba failure trong full run

| Case | Full run | Triage | Follow-up |
|---|---|---|---|
| `controlled-development:1` | FAIL expectation Deep-risk wording | `MODEL_VARIANCE` | Exact rerun PASS 4/4 mà không đổi contract |
| `controlled-development:7` | FAIL vì final response không liệt kê đủ recorded baseline values | `CASE_DEFECT` | Prompt được harden; 2 exact rerun liên tiếp PASS 4/4 |
| `spec-compliance-review:2` | FAIL vì không có path/line cụ thể dù prompt chỉ cung cấp observed absence | `MODEL_VARIANCE` | Exact rerun PASS 4/4 mà không đổi contract |

Sau targeted follow-up, grading hiện hành của cả 48 case đều PASS, nhưng đây không phải một full-suite run đồng nhất. Vì vậy release gate trung thực vẫn là full-run `45/48`, chưa phải xanh tuyệt đối.

## So với baseline 2026-09-19

| Chỉ số | Cũ | Mới |
|---|---:|---:|
| PASS | 19/48 | 45/48 |
| Execution PASS | 0/9 | 8/9 |
| Sandbox-affected execution | 9/9 | 0/9 |
| Model calls | 95 | 95 |
| Input tokens | 3,793,184 | 5,951,600 |
| Output tokens | 58,427 | 88,685 |
| Base API-equivalent cost | khoảng $8.16, có per-call multiplier analysis | khoảng $9.59, chưa có per-call multiplier analysis |

Token usage tăng do các case hiện nhận context policy rõ hơn và execution flows chạy thật thay vì chết sớm ở sandbox. Chất lượng baseline tăng mạnh, nhưng chi phí và model variance vẫn cần được xem như đặc tính của live semantic eval.

## Deterministic gates trước full run

- `node --check evals/runners/run-behavioral-evals.mjs`: PASS.
- `node scripts/validators/validate-plugin.mjs`: PASS.
- `node --test tests/unit`: PASS, `83/83`.
- `node evals/runners/run-behavioral-evals.mjs --all --dry-run`: PASS, 48 case planned.
- `git diff --check`: PASS; chỉ có cảnh báo line-ending CRLF.

## Kết luận release gate

- Sandbox đã được loại khỏi danh sách blocker.
- Không có failure nào được phân loại `SKILL_DEFECT`.
- Full live suite vẫn chưa phù hợp làm hard release gate xanh vì semantic grader/model có variance giữa full run và exact rerun.
- Có thể dùng deterministic gates làm hard gate; live suite nên là quality signal có retry/quorum hoặc policy xử lý variance riêng.
