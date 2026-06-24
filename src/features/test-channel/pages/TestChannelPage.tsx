import { useState, useCallback } from 'react';
import { RotateCcw, Terminal, Bug, Radio, Sparkles, Plug } from 'lucide-react';
import { useTestChat } from '../hooks/useTestChat';
import { TestChannelSetup } from '../components/TestChannelSetup';
import { ChatMessageArea } from '../components/ChatMessageArea';
import { ChatInput } from '../components/ChatInput';
import { DebugPanel } from '../components/DebugPanel';
import { SessionStatePanel } from '../components/SessionStatePanel';
import { ScenarioPresets } from '../components/ScenarioPresets';
import type { TestInteractiveItem } from '../types/test-channel.types';

type RightTab = 'debug' | 'session' | 'scenarios';

export function Component() {
  const [rightTab, setRightTab] = useState<RightTab>('debug');

  // Tenant from auth
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';
  const [senderId] = useState(() => `test-user-${Date.now().toString(36)}`);

  const chat = useTestChat({ tenantId, senderId });

  // ─── Setup callback — fires when connection is established (no session yet) ───
  const handleSetupReady = useCallback(
    (connectionId: string) => {
      chat.initializeConnection(connectionId);
    },
    [chat],
  );

  // ─── Button / list click handlers ───
  const handleButtonClick = useCallback(
    (item: TestInteractiveItem) => {
      chat.sendMessage(item.title ?? '', item.id ?? undefined);
    },
    [chat],
  );

  const handleListSelect = useCallback(
    (item: TestInteractiveItem) => {
      chat.sendMessage(item.title ?? '', item.id ?? undefined);
    },
    [chat],
  );

  // ─── Scenario runner ───
  const runScenario = useCallback(
    async (messages: string[]) => {
      for (let i = 0; i < messages.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 1200));
        chat.sendMessage(messages[i]);
      }
    },
    [chat],
  );

  // Selected debug info
  const selectedDebug = chat.selectedMessageId
    ? (chat.messages.find((m) => m.id === chat.selectedMessageId)?.debug ?? null)
    : null;

  const rightTabs: { id: RightTab; label: string; icon: typeof Bug }[] = [
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'session', label: 'Session', icon: Radio },
    { id: 'scenarios', label: 'Scenarios', icon: Sparkles },
  ];

  // ─── No tenant ───
  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Terminal className="w-8 h-8 text-text-muted mx-auto mb-3" strokeWidth={1.6} />
          <p className="text-sm font-semibold text-text-secondary">No tenant found</p>
          <p className="text-xs text-text-muted mt-1">Log in to access the test channel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[3px] text-brand">Developer tool</div>
          <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-0.5 flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-brand" strokeWidth={1.8} />
            Browser Chat Simulator
          </div>
          <div className="text-sm text-text-secondary mt-1">
            Test your conversation engine in real time. Every message goes through the same pipeline as
            production.
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          {chat.connectionId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-soft border border-[rgba(6,214,160,0.15)]">
              <Plug className="w-3.5 h-3.5 text-success" strokeWidth={1.6} />
              <span className="text-[10px] font-bold text-success uppercase tracking-wider">Connected</span>
            </div>
          )}

          {/* Reset button */}
          {chat.isReady && (
            <button
              onClick={chat.resetSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-glass-1 border border-border-medium
                         text-xs font-semibold text-danger hover:bg-danger-soft hover:border-[rgba(244,63,94,0.15)]
                         transition-all duration-150"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
              Reset session
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-[1fr_340px] gap-4 min-h-[calc(100vh-220px)]">
        {/* ─── Left: Chat Panel ─── */}
        <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-b-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-[#059669] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-text-primary" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Test Channel</div>
                <div className="text-[10px] text-text-muted">
                  {!chat.isReady
                    ? 'Initializing...'
                    : chat.sessionId
                      ? `Session active — ${chat.messages.length} messages`
                      : 'Ready — send a message to start'}
                </div>
              </div>
            </div>
            {chat.sessionState?.mode && (
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  chat.sessionState.mode === 'Menu'
                    ? 'bg-success-soft text-success'
                    : 'bg-brand-soft text-brand'
                }`}
              >
                {chat.sessionState.mode} mode
              </span>
            )}
          </div>

          {/* Setup flow OR Chat messages */}
          {!chat.isReady ? (
            <TestChannelSetup tenantId={tenantId} onReady={handleSetupReady} />
          ) : (
            <>
              <ChatMessageArea
                messages={chat.messages}
                onButtonClick={handleButtonClick}
                onListSelect={handleListSelect}
                selectedMessageId={chat.selectedMessageId}
                onSelectMessage={chat.selectMessage}
              />
              <ChatInput
                onSend={(text) => chat.sendMessage(text)}
                onVoiceRecording={(blob) => chat.sendVoiceMessage(blob)}
                isSending={chat.isSending}
                isVoiceProcessing={chat.isVoiceProcessing}
                placeholder="Type a message to test the engine..."
                enableVoice
              />
            </>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-b-border-subtle">
            {rightTabs.map((tab) => {
              const isActive = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-bold
                             uppercase tracking-wider transition-all duration-150 ${
                               isActive
                                 ? 'text-brand border-b-2 border-b-brand bg-brand-soft/30'
                                 : 'text-text-muted hover:text-text-secondary'
                             }`}
                >
                  <tab.icon className="w-3.5 h-3.5" strokeWidth={1.6} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'debug' && <DebugPanel debug={selectedDebug} />}
            {rightTab === 'session' && (
              <SessionStatePanel session={chat.sessionState} sessionId={chat.sessionId} />
            )}
            {rightTab === 'scenarios' && (
              <ScenarioPresets onRun={runScenario} disabled={!chat.isReady || chat.isSending} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
