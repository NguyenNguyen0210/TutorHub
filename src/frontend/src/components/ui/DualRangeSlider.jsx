import React, { useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * DualRangeSlider — Thanh trượt kép kéo 2 đầu chọn khoảng giá trị (min - max).
 * Thuần chuẩn HTML/CSS, không phụ thuộc thư viện ngoài, tối ưu a11y và touch mobile.
 */
export default function DualRangeSlider({
  min = 0,
  max = 5000000,
  step = 100000,
  value = [0, 5000000],
  onChange,
  minDistance = 0,
  className,
  ariaLabelMin = 'Giá trị tối thiểu',
  ariaLabelMax = 'Giá trị tối đa',
}) {
  const minId = useId();
  const maxId = useId();

  const rawMin = Array.isArray(value) ? Number(value[0]) : min;
  const rawMax = Array.isArray(value) ? Number(value[1]) : max;

  const minVal = Math.min(Math.max(rawMin, min), max);
  const maxVal = Math.max(Math.min(rawMax, max), minVal);

  const rangeSpan = max - min || 1;
  const minPercent = Math.min(100, Math.max(0, Math.round(((minVal - min) / rangeSpan) * 100)));
  const maxPercent = Math.min(100, Math.max(0, Math.round(((maxVal - min) / rangeSpan) * 100)));

  const handleMinChange = useCallback(
    (e) => {
      const newMin = Number(e.target.value);
      const clamped = Math.min(newMin, maxVal - minDistance);
      onChange?.([clamped, maxVal]);
    },
    [maxVal, minDistance, onChange]
  );

  const handleMaxChange = useCallback(
    (e) => {
      const newMax = Number(e.target.value);
      const clamped = Math.max(newMax, minVal + minDistance);
      onChange?.([minVal, clamped]);
    },
    [minVal, minDistance, onChange]
  );

  return (
    <div className={cn('relative w-full select-none py-3.5', className)}>
      {/* Background Track */}
      <div className="relative h-2 w-full rounded-full bg-neutral-200/90 overflow-hidden">
        {/* Active Range Highlight */}
        <div
          className="absolute h-full rounded-full bg-brand-primary-600 transition-all duration-75"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
      </div>

      {/* Min range input */}
      <input
        type="range"
        id={minId}
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={handleMinChange}
        aria-label={ariaLabelMin}
        aria-valuemin={min}
        aria-valuemax={maxVal}
        aria-valuenow={minVal}
        className={cn(
          'pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 w-full appearance-none bg-transparent',
          'focus:outline-none',
          // WebKit Thumb
          '[&::-webkit-slider-thumb]:pointer-events-auto',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-surface',
          '[&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-brand-primary-600',
          '[&::-webkit-slider-thumb]:shadow-brand-sm',
          '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing',
          // Firefox Thumb
          '[&::-moz-range-thumb]:pointer-events-auto',
          '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-surface',
          '[&::-moz-range-thumb]:border-[2.5px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-brand-primary-600',
          '[&::-moz-range-thumb]:shadow-brand-sm',
          '[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing',
          minPercent > 50 ? 'z-20' : 'z-10'
        )}
      />

      {/* Max range input */}
      <input
        type="range"
        id={maxId}
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMaxChange}
        aria-label={ariaLabelMax}
        aria-valuemin={minVal}
        aria-valuemax={max}
        aria-valuenow={maxVal}
        className={cn(
          'pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 w-full appearance-none bg-transparent',
          'focus:outline-none',
          // WebKit Thumb
          '[&::-webkit-slider-thumb]:pointer-events-auto',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-surface',
          '[&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-brand-primary-600',
          '[&::-webkit-slider-thumb]:shadow-brand-sm',
          '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing',
          // Firefox Thumb
          '[&::-moz-range-thumb]:pointer-events-auto',
          '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-surface',
          '[&::-moz-range-thumb]:border-[2.5px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-brand-primary-600',
          '[&::-moz-range-thumb]:shadow-brand-sm',
          '[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing',
          maxPercent <= 50 ? 'z-20' : 'z-10'
        )}
      />
    </div>
  );
}

DualRangeSlider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
  minDistance: PropTypes.number,
  className: PropTypes.string,
  ariaLabelMin: PropTypes.string,
  ariaLabelMax: PropTypes.string,
};

