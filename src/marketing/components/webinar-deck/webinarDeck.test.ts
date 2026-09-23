import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeWebinarHash,
  resolveWebinarSlideId,
  stepWebinarSlide,
  webinarSlideIndex,
} from './webinarDeck.ts';

const slides = [
  { id: 'webinar-hero' },
  { id: 'problem' },
  { id: 'hosts' },
  { id: 'team-universe' },
  { id: 'webinar-fit' },
  { id: 'webinar-faq' },
  { id: 'webinar-register', aliases: ['webinar-register-bottom'] },
];

test('normalizeWebinarHash strips the hash and decodes the id', () => {
  assert.equal(normalizeWebinarHash('#webinar-fit'), 'webinar-fit');
  assert.equal(normalizeWebinarHash('team-universe'), 'team-universe');
  assert.equal(normalizeWebinarHash(''), '');
});

test('resolveWebinarSlideId maps hashes and aliases onto canonical slides', () => {
  assert.equal(resolveWebinarSlideId('#webinar-register', slides), 'webinar-register');
  assert.equal(resolveWebinarSlideId('webinar-register-bottom', slides), 'webinar-register');
  assert.equal(resolveWebinarSlideId('fit', slides), 'webinar-fit');
  assert.equal(resolveWebinarSlideId('hero', slides), 'webinar-hero');
  assert.equal(resolveWebinarSlideId('#missing', slides), 'webinar-hero');
  assert.equal(resolveWebinarSlideId('', slides), 'webinar-hero');
});

test('webinarSlideIndex and stepWebinarSlide stay inside the deck', () => {
  assert.equal(webinarSlideIndex('webinar-fit', slides), 4);
  assert.equal(stepWebinarSlide(0, slides.length, -1), 0);
  assert.equal(stepWebinarSlide(0, slides.length, 1), 1);
  assert.equal(stepWebinarSlide(6, slides.length, 1), 6);
  assert.equal(stepWebinarSlide(6, slides.length, -1), 5);
});
