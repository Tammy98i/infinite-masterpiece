import assert from 'node:assert/strict';
import test from 'node:test';
import { teamGalaxyPublicMembers } from '../../../constants/teamGalaxySeed.ts';
import { calculatePositions, isCtoOrCco, starDiameter } from './galaxyUtils.ts';

test('founder is the largest star and sits at the origin', () => {
  const members = teamGalaxyPublicMembers();
  const { stars } = calculatePositions(members, 1);
  const founder = stars.find((s) => s.isFounder);
  assert.ok(founder);
  assert.equal(founder.x, 0);
  assert.equal(founder.y, 0);
  assert.ok(stars.every((s) => s.isFounder || s.diameter < founder.diameter - 40));
});

test('higher impact_score yields a larger star among the same hierarchy', () => {
  const members = teamGalaxyPublicMembers();
  const core = members.filter((m) => m.group_key === 'core' || m.hierarchy_level === 'core');
  assert.ok(core.length >= 2);
  const sorted = [...core].sort((a, b) => a.impact_score - b.impact_score);
  const small = starDiameter(sorted[0].impact_score, sorted[0], false);
  const large = starDiameter(sorted[sorted.length - 1].impact_score, sorted[sorted.length - 1], false);
  assert.ok(large > small);
});

test('CTO and CCO are the next-largest stars on the inner orbit', () => {
  const members = teamGalaxyPublicMembers();
  const { stars } = calculatePositions(members, 1);
  const inner = stars.filter((s) => isCtoOrCco(s.member));
  assert.equal(inner.length, 2);
  const rest = stars.filter((s) => !s.isFounder && !isCtoOrCco(s.member));
  for (const lead of inner) {
    assert.ok(rest.every((s) => s.diameter < lead.diameter));
    const dist = Math.hypot(lead.x, lead.y / 0.86);
    assert.ok(dist > 200 && dist < 280);
  }
});

test('tablet maxOrbit hides contributor stars', () => {
  const members = teamGalaxyPublicMembers();
  const all = calculatePositions(members, 1);
  const compact = calculatePositions(members, 1, { maxOrbit: 2 });
  assert.ok(all.stars.length > compact.stars.length);
  assert.ok(compact.stars.every((s) => (s.member.orbit ?? 2) <= 2));
});
