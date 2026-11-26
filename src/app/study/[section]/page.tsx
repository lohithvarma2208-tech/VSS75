import { notFound } from 'next/navigation';
import { STUDY_SECTIONS } from '@/lib/study-types';
import StudyView from '../StudyView';

export default async function StudyPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const selected = STUDY_SECTIONS.find((item) => item === section);
  if (!selected) notFound();
  return <StudyView key={selected} section={selected} />;
}
