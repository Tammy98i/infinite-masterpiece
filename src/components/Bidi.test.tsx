import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Bidi } from './Bidi';
import { ClockLabel } from './ClockLabel';
import { SearchRecovery } from './SearchRecovery';

test('elapsed time and duration stay in one LTR island, including the slash', () => {
  const markup = renderToStaticMarkup(
    <Bidi kind="clock"><ClockLabel seconds={65} /> / <ClockLabel seconds={600} /></Bidi>
  );
  assert.match(markup, /^<bdi dir="ltr" data-bidi="ltr" class="bidi-clock">/);
  assert.ok(markup.includes('1:05</bdi> / <bdi'));
  assert.ok(markup.endsWith('10:00</bdi></bdi>'));
});

test('email isolates keep Latin addresses separate from Hebrew copy', () => {
  const markup = renderToStaticMarkup(<p>מנוי · <Bidi kind="email">name+tag@example.com</Bidi></p>);
  assert.ok(markup.includes('<bdi dir="ltr" data-bidi="ltr" class="bidi-email">name+tag@example.com</bdi>'));
});

test('search recovery isolates each query without changing its content', () => {
  const queries = ['NLP (2)', 'מודעות (NLP)', '12 דקות'];
  const markup = renderToStaticMarkup(<SearchRecovery queries={queries} onSelect={() => {}} />);
  for (const query of queries) assert.ok(markup.includes(`<bdi dir="auto">${query}</bdi>`));
  assert.equal((markup.match(/<button /g) || []).length, queries.length);
  assert.equal(renderToStaticMarkup(<SearchRecovery queries={[]} onSelect={() => {}} />), '');
});
