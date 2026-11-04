import test from 'node:test';
import assert from 'node:assert/strict';
import { compactRevenue, revenueMonthLabel, revenueMonthLink, revenueNumber, revenuePeriodTotal, revenueScale } from '../src/utils/revenuePresentation.js';

test('missing revenue is distinct from zero and net fee reversals remain negative', () => {
  for (const value of [null, undefined, '', ' ', NaN, Infinity, false]) assert.equal(revenueNumber(value), null);
  assert.equal(revenueNumber(0), 0);
  assert.equal(revenueNumber('-80000'), -80000);
  assert.equal(revenuePeriodTotal([{ platformRevenue: 100000 }, { platformRevenue: -80000 }]), 20000);
  assert.equal(revenuePeriodTotal([{ platformRevenue: 0 }]), 0);
  assert.equal(revenuePeriodTotal([{ platformRevenue: 100000 }, { platformRevenue: null }]), null);
  assert.equal(revenuePeriodTotal([]), null);
  assert.equal(compactRevenue(4210000), '4,21 triệu ₫');
  assert.equal(compactRevenue(null), '—');
});

test('chart scale includes zero and both sides of signed revenue without inflating zero months', () => {
  const scale = revenueScale([{ platformRevenue: 4210000 }, { platformRevenue: -200000 }, { platformRevenue: null }]);
  assert.ok(scale.max >= 4210000 && scale.min <= -200000);
  assert.ok(scale.ticks.includes(0));
  assert.ok(scale.ticks.every(value => value >= scale.min && value <= scale.max));
  assert.deepEqual(revenueScale([{ platformRevenue: 0 }]), { min: 0, max: 1, ticks: [0] });
  assert.equal(revenueScale([{ platformRevenue: -100 }]).max, 0);
});

test('month drill-down uses inclusive Vietnam calendar dates including leap years and December', () => {
  assert.equal(revenueMonthLabel('2026-11'), '11/2026');
  assert.equal(revenueMonthLink('2024-02'), '/admin/transactions?fromDate=2024-02-01&toDate=2024-02-29&sort=Oldest');
  assert.equal(revenueMonthLink('2026-12'), '/admin/transactions?fromDate=2026-12-01&toDate=2026-12-31&sort=Oldest');
  assert.equal(revenueMonthLink('2026-13'), null);
  assert.equal(revenueMonthLabel(null), '—');
});
