import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hidden border-t border-white/[0.07] md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-7 py-8 text-[11px] text-white/35">
        <p>© {new Date().getFullYear()} VSS · Built by students, for students.</p>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="hover:text-white">Resources</Link>
          <Link href="/requests" className="hover:text-white">Requests</Link>
          <Link href="/upload" className="inline-flex items-center gap-1 hover:text-white">Share work <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </div>
    </footer>
  );
}
