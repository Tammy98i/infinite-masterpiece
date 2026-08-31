import { listTeamFounders } from './_lib/foundersStore.js';
import { CATEGORIES, COURSES, INSTRUCTORS } from './_lib/staticData.js';

type VercelReq = { method?: string };
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const teamFounders = await listTeamFounders().catch(() => []);
  const dynamicIds = new Set(teamFounders.map((row) => row.id));
  const mergedInstructors = [
    ...teamFounders.map((founder) => ({
      id: founder.id,
      name: founder.name,
      title: founder.title,
      avatarUrl: founder.avatarUrl,
      bio: founder.bio,
      credentials: founder.credentials,
      isFounder: true,
      founderId: founder.founderId,
      externalLinks: founder.externalLinks || [],
    })),
    ...INSTRUCTORS.filter((inst) => !dynamicIds.has(inst.id)),
  ];

  res.status(200).json({
    courses: COURSES,
    instructors: mergedInstructors,
    categories: CATEGORIES,
    weeklyPopularIds: COURSES.filter((course) => course.isPopular).slice(0, 8).map((course) => course.id),
  });
}
