'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, FileText, ArrowUpRight, ExternalLink, Download } from 'lucide-react';
import { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { formatBytes } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface SmartMatchSuggestionsProps {
  courseCode?: string;
  courseName?: string;
  topic?: string;
  title?: string;
  category?: string;
}

export default function SmartMatchSuggestions({
  courseCode,
  courseName,
  topic,
  title,
  category,
}: SmartMatchSuggestionsProps) {
  const allResources = useMemo(() => {
    return MockStorageManager.getResources();
  }, []);

  const matches = useMemo(() => {
    if (!courseCode && !topic && !title) return [];

    const cleanCode = (courseCode || '').toLowerCase().trim();
    const cleanTopic = (topic || '').toLowerCase().trim();
    const cleanTitle = (title || '').toLowerCase().trim();

    // Score and filter resources
    const scored: { resource: Resource; score: number }[] = [];

    for (const res of allResources) {
      let score = 0;
      const resCode = res.course_code.toLowerCase();
      const resTitle = res.title.toLowerCase();
      const resDesc = res.description.toLowerCase();
      const resCat = res.category.toLowerCase();

      // Strong course code match
      if (cleanCode && resCode === cleanCode) score += 5;
      else if (cleanCode && resCode.includes(cleanCode)) score += 3;

      // Topic keywords match
      if (cleanTopic && cleanTopic.length > 2) {
        const topicWords = cleanTopic.split(/\s+/);
        for (const word of topicWords) {
          if (word.length > 2) {
            if (resTitle.includes(word)) score += 2;
            if (resDesc.includes(word)) score += 1;
          }
        }
      }

      // Title keywords match
      if (cleanTitle && cleanTitle.length > 3) {
        const titleWords = cleanTitle.split(/\s+/).filter((w) => w.length > 3);
        for (const word of titleWords) {
          if (resTitle.includes(word)) score += 2;
        }
      }

      // Category match
      if (category && resCat === category.toLowerCase()) score += 1;

      if (score >= 3) {
        scored.push({ resource: res, score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.resource);
  }, [allResources, courseCode, courseName, topic, title, category]);

  if (matches.length === 0) return null;

  return (
    <div className="rounded-3xl border border-purple-500/30 bg-[#131B2E]/90 p-5 sm:p-6 text-white shadow-xl animate-fadeIn">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#D8B4FE]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold tracking-tight text-[#D8B4FE]">
            Possible Matches Found in VSS Library!
          </h4>
          <p className="text-[11px] text-white/70">
            You might already find what you are looking for before posting this request:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {matches.map((res) => (
          <div
            key={res.id}
            className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#0B0F19]/90 border border-white/10 hover:border-purple-500/40 hover:bg-[#1A243B] transition group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold">
                  {res.course_code}
                </span>
                <span className="text-[10px] text-white/50">{res.semester}</span>
              </div>
              <h5 className="text-xs font-bold line-clamp-2 text-white group-hover:text-[#D8B4FE] transition">
                {res.title}
              </h5>
              <p className="text-[11px] text-white/60 line-clamp-2 mt-1">
                {res.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-white/10">
              <span className="text-[10px] text-white/50 flex items-center gap-1">
                <FileText className="h-3 w-3 text-rose-400" />
                {res.file_type.toUpperCase()} · {formatBytes(res.file_size)}
              </span>
              <Link
                href={`/resource/${res.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38BDF8] hover:underline"
              >
                <span>View</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
