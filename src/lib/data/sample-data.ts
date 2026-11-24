import { Resource, ProjectItem, UserProfile, Course } from '@/types';
import { KLU_COURSES } from './klu-courses';

export const SAMPLE_COURSES: Course[] = KLU_COURSES.map((c) => ({
  code: c.code,
  name: c.name,
  department: c.department,
  semester: c.semester,
}));

export const DEMO_USERS: UserProfile[] = [];

export const SAMPLE_RESOURCES: Resource[] = [];

export const SAMPLE_PROJECTS: ProjectItem[] = [];
