import assert from 'node:assert/strict';
import test from 'node:test';
import { teamGalaxyPublicMembers } from './teamGalaxySeed.ts';
import { fillHostsLead, joinHebrewNames, webinarHosts } from './webinarHosts.ts';

test('seed hosts are Gal, Tami and Gleb only', () => {
  const hosts = webinarHosts(teamGalaxyPublicMembers() as never);
  assert.deepEqual(
    hosts.map((member) => member.id),
    ['tm-gal', 'tm-tami', 'tm-gleb'],
  );
});

test('joinHebrewNames uses comma and vav', () => {
  assert.equal(joinHebrewNames(['גל', 'תמי', 'גלב']), 'גל, תמי וגלב');
  assert.equal(joinHebrewNames(['גל']), 'גל');
});

test('fillHostsLead substitutes live names', () => {
  const members = teamGalaxyPublicMembers() as never;
  assert.equal(
    fillHostsLead('{hosts} בלייב. שיעור מכירות.', members),
    'גל, תמי וגלב בלייב. שיעור מכירות.',
  );
});
