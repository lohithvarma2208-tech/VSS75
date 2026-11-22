import { Lock } from 'lucide-react';
import { BADGE_TONES, type StudentBadge } from '@/lib/badges';

export default function BadgeShelf({ badges, compact = false }: { badges: StudentBadge[]; compact?: boolean }) {
  const earned = badges.filter((item) => item.earned);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="vss-kicker">Recognition</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">Badges</h2>
        </div>
        <p className="text-[10px] font-bold text-white/35">{earned.length} of {badges.length} unlocked</p>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'}`}>
        {badges.map((badge) => {
          const Icon = badge.icon;
          const tone = BADGE_TONES[badge.tone];
          const percent = badge.target ? Math.round((badge.progress / badge.target) * 100) : 0;
          return (
            <article key={badge.id} className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border p-3.5 sm:p-4 ${badge.earned ? tone.shell : 'border-white/[0.07] bg-white/[0.025] opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${badge.earned ? tone.icon : 'bg-white/[0.07] text-white/35'}`}><Icon className="h-4 w-4" /></span>
                {!badge.earned && <Lock className="h-3.5 w-3.5 text-white/25" />}
              </div>
              <h3 className="mt-4 truncate text-xs font-extrabold">{badge.name}</h3>
              {!compact && <p className="mt-1 line-clamp-2 min-h-8 text-[9px] leading-4 text-white/38">{badge.description}</p>}
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${badge.earned ? tone.bar : 'bg-white/20'}`} style={{ width: `${percent}%` }} /></div>
              <p className="mt-1.5 truncate text-[8px] font-semibold text-white/30">{badge.earned ? 'Unlocked' : badge.progressLabel}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
