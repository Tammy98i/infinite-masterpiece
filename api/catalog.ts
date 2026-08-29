import { COURSES, INSTRUCTORS, CATEGORIES } from '../src/data/initialData';

type VercelReq = { method?: string };
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
    courses: COURSES,
    instructors: INSTRUCTORS,
    categories: CATEGORIES,
    weeklyPopularIds: COURSES.filter((course) => course.isPopular).slice(0, 8).map((course) => course.id),
  });
}
