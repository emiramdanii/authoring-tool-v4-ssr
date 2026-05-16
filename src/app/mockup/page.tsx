import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SILSE — Modern Clean UI Mockup',
};

export default function MockupPage() {
  return (
    <iframe
      src="/mockup.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
      title="SILSE UI Mockup"
    />
  );
}
