import type { TeamMember } from '../api/teamMembers';
import { localizedName, localizedRole } from './teamGalaxySeed';

export function isPublishedMember(member: TeamMember): boolean {
  if (member.archived) return false;
  if (member.status === 'hidden' || member.status === 'draft') return false;
  return member.active !== false;
}

export function webinarHosts(members: TeamMember[]): TeamMember[] {
  return members
    .filter((member) => member.featured && isPublishedMember(member))
    .sort((a, b) => a.display_order - b.display_order);
}

export function hostFirstName(member: TeamMember, locale: 'he' | 'en' = 'he'): string {
  const full = localizedName(member, locale).trim();
  return full.split(/\s+/)[0] || full;
}

export function joinHebrewNames(names: string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ו${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} ו${clean[clean.length - 1]}`;
}

export function fillHostsLead(template: string, members: TeamMember[]): string {
  const names = joinHebrewNames(webinarHosts(members).map((member) => hostFirstName(member)));
  return template.replaceAll('{hosts}', names || 'המנחים');
}

export function hostCard(member: TeamMember) {
  return {
    id: member.id,
    name: localizedName(member, 'he'),
    title: localizedRole(member, 'he') || localizedRole(member, 'en'),
    bio: member.bio || member.contribution || '',
    image: member.photo || '',
    alt: member.photo_alt || localizedName(member, 'he'),
  };
}
