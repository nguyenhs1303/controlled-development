# Evidence

## EVID-RED-001

- Trạng thái: `PASS`
- Kiểm tra: thêm test yêu cầu artifact root canonical là `.codex/workflows/changes/<change-id>`.
- Kết quả: test mới thất bại đúng nguyên nhân vì validator vẫn yêu cầu `.ai-workflow/changes/<change-id>`.

## EVID-GREEN-001

- Trạng thái: `PASS`
- Lệnh: `node --test scripts/validate.test.mjs`
- Kết quả: `29 tests`, `29 pass`, `0 fail`, `0 skip` khi `CONTROLLED_DEVELOPMENT_PYTHON` trỏ tới
  virtual environment validation.

## EVID-SOURCE-001

- Trạng thái: `PASS`
- Lệnh: `node scripts/validate.mjs .`
- Kết quả: source plugin hợp lệ với default `.codex/workflows/changes/<change-id>`.

## EVID-MIGRATION-001

- Trạng thái: `PASS`
- Kiểm tra: validate ba workflow trong source plugin và tìm reference `.ai-workflow` còn hoạt động.
- Kết quả: ba state hợp lệ; thư mục `.ai-workflow` đã được migrate và không còn tồn tại trong source plugin.
- Bảo toàn: hai workflow cũ giữ nguyên phase và approval trước khi migrate.

## EVID-INSTALL-001

- Trạng thái: `PASS`
- Kết quả: cachebuster và reinstall qua helper của `plugin-creator`.
- Version: `0.1.0+codex.20260915081303`.

## EVID-INSTALLED-001

- Trạng thái: `PASS`
- Kiểm tra: Node validator và unit test chạy trên installed cache.
- Kết quả: validator pass; `29 pass`, `0 fail`, `0 skip`; cache không còn `.ai-workflow`.

## EVID-FRESH-001

- Trạng thái: `PASS`
- Kiểm tra: mở Codex session tạm mới và đọc plugin đang được nạp.
- Kết quả: session mới nạp version `0.1.0+codex.20260915081303` và default root mới.

## EVID-REPO-001

- Trạng thái: `PASS`
- Đối tượng: `C:/bnk/payment-hub/sla-service-fe/.codex/instructions/common/working-rules.md`.
- Kết quả: ba validator repo pass; bốn workflow hiện có vẫn pass với validator plugin mới.

## EVID-PYTHON-001

- Trạng thái: `PASS`
- Môi trường: `C:/Users/BnK/.codex/venvs/plugin-validation`, Python `3.12.14`, PyYAML `6.0.2`.
- Kiểm tra: chạy `quick_validate.py` cho cả tám skill và `validate_plugin.py` cho toàn bộ plugin.
- Kết quả source: tám skill hợp lệ; plugin validation pass.
- Kết quả installed cache: tám skill hợp lệ; plugin validation pass cho version
  `0.1.0+codex.20260915081303`.

## EVID-REVIEW-SPEC-001

- Trạng thái: `PASS`
- Kết quả: không có finding Critical hoặc Important; `AC-001` đến `AC-007` đều có bằng chứng.

## EVID-REVIEW-ENG-001

- Trạng thái: `PASS`
- Kết quả: không có finding Critical hoặc Important.
- Rủi ro còn lại: không có khoảng trống validator đã biết trong phạm vi thay đổi.
