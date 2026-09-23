import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPhysicalUtility,
  rtlPhysicalToLogical,
  toLogicalUtility,
  UNMIRRORED_ICONS,
} from './bidi.ts';

test('toLogicalUtility converts LTR-authored padding and margin', () => {
  assert.equal(toLogicalUtility('pr-9'), 'pe-9');
  assert.equal(toLogicalUtility('pl-8'), 'ps-8');
  assert.equal(toLogicalUtility('ml-10'), 'ms-10');
  assert.equal(toLogicalUtility('sm:ml-14'), 'sm:ms-14');
  assert.equal(toLogicalUtility('mr-1.5'), 'me-1.5');
  assert.equal(toLogicalUtility('-right-3'), '-end-3');
});

test('toLogicalUtility keeps centering left-1/2 physical', () => {
  assert.equal(toLogicalUtility('left-0'), 'start-0');
  assert.equal(toLogicalUtility('right-2'), 'end-2');
  assert.equal(toLogicalUtility('sm:left-2'), 'sm:start-2');
  assert.equal(toLogicalUtility('left-1/2'), 'left-1/2');
  assert.equal(toLogicalUtility('right-1/2'), 'right-1/2');
});

test('toLogicalUtility maps text alignment to start', () => {
  assert.equal(toLogicalUtility('text-right'), 'text-start');
  assert.equal(toLogicalUtility('md:text-right'), 'md:text-start');
  assert.equal(toLogicalUtility('text-left'), 'text-start');
});

test('rtlPhysicalToLogical maps visual-right tokens to inline-start', () => {
  assert.equal(rtlPhysicalToLogical('pr-9'), 'ps-9');
  assert.equal(rtlPhysicalToLogical('right-3'), 'start-3');
  assert.equal(rtlPhysicalToLogical('pl-8'), 'pe-8');
  assert.equal(rtlPhysicalToLogical('left-2.5'), 'end-2.5');
  assert.equal(rtlPhysicalToLogical('-right-3'), '-start-3');
});

test('isPhysicalUtility detects leftover physical utilities', () => {
  assert.equal(isPhysicalUtility('pr-12'), true);
  assert.equal(isPhysicalUtility('pe-12'), false);
  assert.equal(isPhysicalUtility('left-1/2'), false);
});

test('media and search icons stay unmirrored', () => {
  for (const icon of ['play', 'search', 'check', 'clock', 'pause'] as const) {
    assert.ok(UNMIRRORED_ICONS.includes(icon));
  }
});
