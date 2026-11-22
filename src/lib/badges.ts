import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck, BookOpenCheck, Crown, Download, Heart, Rocket,
  ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import type { ProjectItem, Resource, UserProfile } from '@/types';

export type BadgeTone = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose';

export interface StudentBadge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: BadgeTone;
  earned: boolean;
  progress: number;
  target: number;
  progressLabel: string;
}

interface BadgeContext {
  profile: UserProfile;
  resources: Resource[];
  projects?: ProjectItem[];
}

export function getStudentBadges({ profile, resources, projects = [] }: BadgeContext): StudentBadge[] {
  const uploads = resources.length;
  const likes = resources.reduce((sum, item) => sum + item.likes_count, 0);
  const downloads = resources.reduce((sum, item) => sum + item.downloads_count, 0);

  const badge = (
    id: string, name: string, description: string, icon: LucideIcon, tone: BadgeTone,
    value: number, target: number, suffix: string,
  ): StudentBadge => ({
    id, name, description, icon, tone, target,
    earned: value >= target,
    progress: Math.min(value, target),
    progressLabel: `${Math.min(value, target)} / ${target} ${suffix}`,
  });

  return [
    badge('verified', 'Verified Scholar', 'Confirmed member of the KLU student community.', BadgeCheck, 'violet', profile.is_verified_student ? 1 : 0, 1, 'verification'),
    badge('first-share', 'First Share', 'Shared a first useful resource with the community.', BookOpenCheck, 'cyan', uploads, 1, 'upload'),
    badge('study-helper', 'Study Helper', 'Built a useful shelf of three student resources.', Users, 'emerald', uploads, 3, 'uploads'),
    badge('resource-builder', 'Resource Builder', 'Contributed five resources across VSS.', Rocket, 'violet', uploads, 5, 'uploads'),
    badge('campus-favorite', 'Campus Favorite', 'Earned 100 likes across shared resources.', Heart, 'rose', likes, 100, 'likes'),
    badge('high-impact', 'High Impact', 'Helped power 500 student downloads.', Download, 'cyan', downloads, 500, 'downloads'),
    badge('project-maker', 'Project Maker', 'Published a project to the student showcase.', Sparkles, 'amber', projects.length, 1, 'project'),
    badge('community-guardian', 'Community Guardian', 'Trusted to help moderate the VSS community.', ShieldCheck, 'emerald', profile.role === 'moderator' || profile.role === 'admin' ? 1 : 0, 1, 'role'),
    badge('vss-steward', 'VSS Steward', 'Maintains and stewards the VSS platform.', Crown, 'amber', profile.role === 'admin' ? 1 : 0, 1, 'role'),
  ];
}

export const BADGE_TONES: Record<BadgeTone, { shell: string; icon: string; bar: string }> = {
  violet: { shell: 'border-violet-400/20 bg-violet-400/[0.07]', icon: 'bg-violet-400 text-black', bar: 'bg-violet-400' },
  cyan: { shell: 'border-cyan-400/20 bg-cyan-400/[0.06]', icon: 'bg-cyan-300 text-black', bar: 'bg-cyan-300' },
  emerald: { shell: 'border-emerald-400/20 bg-emerald-400/[0.06]', icon: 'bg-emerald-300 text-black', bar: 'bg-emerald-300' },
  amber: { shell: 'border-amber-300/20 bg-amber-300/[0.06]', icon: 'bg-amber-300 text-black', bar: 'bg-amber-300' },
  rose: { shell: 'border-rose-400/20 bg-rose-400/[0.06]', icon: 'bg-rose-400 text-black', bar: 'bg-rose-400' },
};
