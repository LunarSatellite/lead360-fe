import { useNavigate } from 'react-router-dom';

export function OnboardingComplete() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-2">You're Live!</h2>
      <p className="text-sm text-text-muted mb-8">
        Your OmniFlow chatbot is set up and ready to handle conversations.
        Monitor performance in the Analytics dashboard.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => navigate('/dashboard/flows')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border-subtle hover:bg-glass-1 transition-colors"
        >
          Open Flow Builder
        </button>
        <button
          onClick={() => navigate('/dashboard/analytics')}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
        >
          View Analytics
        </button>
      </div>
    </div>
  );
}
