'use client';

import dynamic from 'next/dynamic';

const AuthoringTool = dynamic(() => import('@/components/authoring/AuthoringTool'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <div className="text-slate-200 text-sm font-semibold">Authoring Tool v4</div>
        <div className="text-slate-500 text-xs mt-1">Memuat Media Pembelajaran Interaktif...</div>
        <div className="mt-4 w-32 h-1 mx-auto bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500/60 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <AuthoringTool />;
}
