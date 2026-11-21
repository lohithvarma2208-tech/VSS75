import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070A11] text-white/70 px-6 sm:px-12 lg:px-16 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3.5 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl text-white tracking-tighter">VSS</span>
            <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Agentic Student Space
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Student-driven academic knowledge network for KL University (KLU), India.
            Organizing assignments, lab records, DTIE innovation projects, and lecture notes.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <GraduationCap className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span>Vaddeswaram & Hyderabad Campuses</span>
          </div>
        </div>

        {/* Academic Categories */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] mb-3 font-mono">
            Resource Hubs
          </h3>
          <ul className="space-y-2 text-xs font-medium text-slate-300/80">
            <li>
              <Link href="/explore?category=Assignments" className="hover:text-[#38BDF8] transition">
                Assignments & Problem Sets
              </Link>
            </li>
            <li>
              <Link href="/explore?category=Lab%20Records" className="hover:text-[#38BDF8] transition">
                Lab Records & Observations
              </Link>
            </li>
            <li>
              <Link href="/projects?category=DTIE%20Project" className="hover:text-[#38BDF8] transition">
                DTIE Innovation Reports
              </Link>
            </li>
            <li>
              <Link href="/notes" className="hover:text-[#38BDF8] transition">
                Handwritten & Unit Notes
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-[#38BDF8] transition">
                Capstone & Mini Projects
              </Link>
            </li>
          </ul>
        </div>

        {/* Departments */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] mb-3 font-mono">
            Departments Covered
          </h3>
          <ul className="space-y-2 text-xs font-medium text-slate-300/80">
            <li>
              <Link href="/explore?q=CSE" className="hover:text-[#38BDF8] transition">
                Computer Science & Engg (CSE)
              </Link>
            </li>
            <li>
              <Link href="/explore?q=AI%26DS" className="hover:text-[#38BDF8] transition">
                Artificial Intelligence & Data Science
              </Link>
            </li>
            <li>
              <Link href="/explore?q=ECE" className="hover:text-[#38BDF8] transition">
                Electronics & Communication (ECE)
              </Link>
            </li>
            <li>
              <Link href="/explore?q=CS%26IT" className="hover:text-[#38BDF8] transition">
                Computer Science & Info Tech (CS&IT)
              </Link>
            </li>
            <li>
              <Link href="/explore?q=DTIE" className="hover:text-[#38BDF8] transition">
                Design Thinking (DTIE) Hub
              </Link>
            </li>
          </ul>
        </div>

        {/* Academic Integrity & Ethics */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] mb-3 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" /> Academic Integrity
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Virtual Student Space is intended purely for <strong>peer learning, conceptual reference, and study analysis</strong>.
            Uphold academic honor codes. Never plagiarize or submit verbatim copies.
          </p>
          <div className="mt-3 text-[11px] bg-white/5 p-2.5 rounded-2xl border border-white/10 text-slate-300">
            <span className="font-bold text-white">Independent Community:</span> Not an official ERP portal.
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40">
        <p>© {new Date().getFullYear()} Virtual Student Space (VSS). Built for students of KL University.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0 font-medium text-white/60">
          Learn from peers <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> Build together.
        </p>
      </div>
    </footer>
  );
}
