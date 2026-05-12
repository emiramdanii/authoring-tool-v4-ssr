'use client';

import { useEffect, useState } from 'react';
import AIAssistantPanel from '../ai-assistant/AIAssistantPanel';
import Section from './Section';

/**
 * AI Assistant section — self-contained wrapper that manages its own
 * collapsed state and listens for the "open-ai-assistant" custom event
 * (dispatched from context menu).
 */
export default function AIAssistantSection() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const handler = () => setCollapsed(false);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  return (
    <Section
      icon={<span className="text-xs">🤖</span>}
      title="AI Assistant"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      <AIAssistantPanel />
    </Section>
  );
}
