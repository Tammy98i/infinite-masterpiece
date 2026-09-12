import { teamGalaxyPublicMembers } from '../../src/constants/teamGalaxySeed.ts';

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
  const raw = req.query?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const member = teamGalaxyPublicMembers().find((item) => item.id === id);
  if (!member) {
    res.status(404).json({ error: 'איש צוות לא נמצא' });
    return;
  }
  res.status(200).json(member);
}
