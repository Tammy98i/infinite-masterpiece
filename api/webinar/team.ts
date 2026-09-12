import { TEAM_SECTION_DEFAULTS, teamGalaxyPublicMembers } from '../../src/constants/teamGalaxySeed.ts';

type VercelReq = { method?: string; query?: Record<string, string | string[] | undefined> };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({
    settings: TEAM_SECTION_DEFAULTS,
    members: teamGalaxyPublicMembers(),
  });
}
