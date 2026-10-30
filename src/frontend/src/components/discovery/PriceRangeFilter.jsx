import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DualRangeSlider from '@/components/ui/DualRangeSlider';
import { formatVND } from '@/utils/formatters';

const DEFAULT_STEP = 100000;

const formatPriceDigits = (raw) => {
  const digits = String(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
};

const formatPriceValue = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

/**
 * PriceRangeFilter — khối lọc khoảng giá dùng chung cho marketplace gia sư và dịch vụ.
 * Gồm: dòng đọc giá trị, thanh trượt hai đầu, ô nhập Từ/Đến và các preset.
 * onChange nhận [min, max] và luôn bảo đảm min <= max trong [0, limit].
 */
export default function PriceRangeFilter({
  min = 0,
  max = 10000000,
  limit = 10000000,
  step = DEFAULT_STEP,
  presets = [],
  onChange,
  ariaLabelMin = 'Giá tối thiểu (đồng)',
  ariaLabelMax = 'Giá tối đa (đồng)',
  ariaLabelMinInput = 'Nhập giá tối thiểu (đồng)',
  ariaLabelMaxInput = 'Nhập giá tối đa (đồng)',
}) {
  // Bản nháp khi người dùng gõ trực tiếp vào ô Từ / Đến (null = hiển thị theo giá trị thật).
  const [minDraft, setMinDraft] = useState(null);
  const [maxDraft, setMaxDraft] = useState(null);

  useEffect(() => {
    setMinDraft(null);
    setMaxDraft(null);
  }, [min, max]);

  const commitField = (field, raw) => {
    const digits = String(raw ?? '').replace(/\D/g, '');
    const snapped = Math.round((Number(digits) || 0) / step) * step;
    if (field === 'min') {
      onChange([Math.min(Math.max(0, snapped), max), max]);
      setMinDraft(null);
    } else {
      onChange([min, Math.max(Math.min(limit, snapped), min)]);
      setMaxDraft(null);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <>
      <div className="mkt-price-readout">
        <span className="mkt-price-readout-label">Mức giá:</span>
        <span className="mkt-price-readout-value">
          {formatVND(min)} – {formatVND(max)}
        </span>
      </div>

      <DualRangeSlider
        min={0}
        max={limit}
        step={step}
        value={[min, max]}
        onChange={onChange}
        ariaLabelMin={ariaLabelMin}
        ariaLabelMax={ariaLabelMax}
        className="mkt-price-slider"
      />

      <div className="mkt-price-inputs">
        <label className="mkt-price-field">
          <span>Từ</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={minDraft ?? formatPriceValue(min)}
            onChange={(event) => setMinDraft(formatPriceDigits(event.target.value))}
            onBlur={() => commitField('min', minDraft ?? min)}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabelMinInput}
          />
        </label>
        <span className="mkt-price-inputs-sep" aria-hidden="true">–</span>
        <label className="mkt-price-field">
          <span>Đến</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={maxDraft ?? formatPriceValue(max)}
            onChange={(event) => setMaxDraft(formatPriceDigits(event.target.value))}
            onBlur={() => commitField('max', maxDraft ?? max)}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabelMaxInput}
          />
        </label>
      </div>

      {presets.length > 0 && (
        <div className="mkt-filter-chip-grid mkt-price-presets">
          {presets.map((preset) => {
            const selected = min === preset.min && max === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange([preset.min, preset.max])}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

PriceRangeFilter.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  limit: PropTypes.number,
  step: PropTypes.number,
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      min: PropTypes.number.isRequired,
      max: PropTypes.number.isRequired,
    })
  ),
  onChange: PropTypes.func.isRequired,
  ariaLabelMin: PropTypes.string,
  ariaLabelMax: PropTypes.string,
  ariaLabelMinInput: PropTypes.string,
  ariaLabelMaxInput: PropTypes.string,
};
