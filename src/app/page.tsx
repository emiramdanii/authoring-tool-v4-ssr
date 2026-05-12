'use client';

import dynamic from 'next/dynamic';

const AuthoringTool = dynamic(() => import('@/components/authoring/AuthoringTool'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-app-bg">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <div className="text-app-primary text-sm font-semibold">Authoring Tool v4</div>
        <div className="text-app-muted text-xs mt-1">Memuat Media Pembelajaran Interaktif...</div>
        <div className="mt-4 w-32 h-1 mx-auto bg-app-elevated rounded-full overflow-hidden">
          <div className="h-full bg-app-accent/60 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <AuthoringTool />;
}
