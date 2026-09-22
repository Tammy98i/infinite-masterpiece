import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortTeam, starDiameter, starPosition, validateTeamMember, type TeamMemberInput } from './teamMembers.ts';
const input: TeamMemberInput = { name: 'Test', role: 'Core', bio: '', photo: '', vision: '', contribution: '', responsibilities: [], expertise: [], hierarchy_level: 'core', impact_score: 50, orbit: 2, active: true, display_order: 0 };
test('impact increases diameter and changes position, sun remains largest', () => {
  for (let score = 0; score < 100; score++) assert.ok(starDiameter({ ...input, impact_score: score }) < starDiameter({ ...input, impact_score: score + 1 }));
  assert.ok(starDiameter({ ...input, hierarchy_level: 'founder', impact_score: 0 }) > starDiameter({ ...input, hierarchy_level: 'leadership', impact_score: 100 }));
  assert.ok(starDiameter({ ...input, hierarchy_level: 'leadership', impact_score: 0 }) > starDiameter({ ...input, impact_score: 100 }));
  assert.notDeepEqual(starPosition({ ...input, id: '1', hierarchy_level: 'leadership' }, 0), starPosition({ ...input, id: '1' }, 0, 6));
  assert.notDeepEqual(starPosition({ ...input, id: '1' }, 0, 6), starPosition({ ...input, id: '1', impact_score: 90 }, 0, 6));
  assert.notDeepEqual(starPosition({ ...input, id: '1' }, 0, 6), starPosition({ ...input, id: '1', orbit: 4 }, 0, 6));
  const first = starPosition({ ...input, id: '1' }, 0, 6);
  const last = starPosition({ ...input, id: '6' }, 5, 6);
  assert.ok(Math.hypot(first.x - last.x, first.y - last.y) > 8);
  const leaders = [0, 1].map(slot => starPosition({ ...input, id: `lead-${slot}`, hierarchy_level: 'leadership' }, slot, 2));
  for (const total of [6, 9]) {
    const contributors = Array.from({ length: total }, (_, slot) => starPosition({ ...input, id: String(slot) }, slot, total));
    for (const [index, point] of contributors.entries()) {
      assert.ok(!(Math.abs(point.x - 50) < 8 && point.y < 28), `slot ${index}/${total} sits on the top of the ring`);
      assert.ok(point.y < 80, `slot ${index}/${total} sits on the manifesto`);
      assert.ok(point.x < 24 || point.x > 76, `slot ${index}/${total} crowds the sun`);
      for (const other of contributors.slice(index + 1)) {
        assert.ok(Math.hypot(point.x - other.x, point.y - other.y) > 14, `contributors merge at ${total}`);
      }
      for (const lead of leaders) {
        assert.ok(Math.hypot(point.x - lead.x, point.y - lead.y) > 14, `contributor overlaps leadership at ${total}`);
      }
    }
  }
  assert.ok(Math.hypot(leaders[0].x - leaders[1].x, leaders[0].y - leaders[1].y) > 24, 'leadership stars merge');
});
test('invalid fields and image protocols are rejected', () => {
  for (const impact_score of [-1, 101, 2.5, '90', null]) assert.throws(() => validateTeamMember({ ...input, impact_score }));
  for (const photo of ['javascript:alert(1)', '//evil.example/a', 'data:image/svg+xml,x']) assert.throws(() => validateTeamMember({ ...input, photo }));
  assert.throws(() => validateTeamMember({ ...input, name: ' ' }));
  assert.throws(() => validateTeamMember({ ...input, hierarchy_level: 'unknown' }));
  assert.throws(() => validateTeamMember({ ...input, active: 'false' }));
  assert.throws(() => validateTeamMember({ ...input, orbit: 0 }));
  assert.throws(() => validateTeamMember({ ...input, responsibilities: 'text' }));
  assert.equal(validateTeamMember({ ...input, photo: '/uploads/photo.png' }).photo, '/uploads/photo.png');
  assert.equal(validateTeamMember({ ...input, hierarchy_level: 'founder' }).orbit, 0);
});
test('hierarchy, orbit and display order determine roster ordering', () => {
  const list = sortTeam([{ ...input, id: 'b', display_order: 2 }, { ...input, id: 'a', display_order: 1 }, { ...input, id: 'sun', hierarchy_level: 'founder' }]);
  assert.deepEqual(list.map(m => m.id), ['sun', 'a', 'b']);
});
