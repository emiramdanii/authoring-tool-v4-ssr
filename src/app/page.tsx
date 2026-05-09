'use client';

import dynamic from 'next/dynamic';

const AuthoringTool = dynamic(() => import('@/components/authoring/AuthoringTool'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">📝</div>
        <div className="text-zinc-400 text-sm">Memuat Authoring Tool v4...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <AuthoringTool />;
}
