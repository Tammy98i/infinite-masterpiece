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

test('CTO and CCO are the next-largest stars on the inner orbit', () => {
  const members = teamGalaxyPublicMembers();
  const { stars } = calculatePositions(members, 1);
  const inner = stars.filter((s) => isCtoOrCco(s.member));
  assert.equal(inner.length, 2);
  const rest = stars.filter((s) => !s.isFounder && !isCtoOrCco(s.member));
  for (const lead of inner) {
    assert.equal(starDiameter(lead.member.impact_score, lead.member, false), 96);
    assert.ok(rest.every((s) => s.diameter < lead.diameter));
    const dist = Math.hypot(lead.x, lead.y / 0.86);
    assert.ok(dist > 200 && dist < 280);
  }
});
