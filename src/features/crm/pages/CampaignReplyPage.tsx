import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;

interface ReplyInfo {
  campaignName: string;
  contactName: string;
  alreadyReplied: boolean;
  repliedAt: string | null;
}

type PageState = 'loading' | 'ready' | 'sending' | 'sent' | 'already_replied' | 'error';

export function Component() {
  const { recipientId } = useParams<{ recipientId: string }>();
  const [info, setInfo] = useState<ReplyInfo | null>(null);
  const [message, setMessage] = useState('');
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!recipientId) { setPageState('error'); setErrorMsg('Invalid reply link.'); return; }

    axios.get(`${API}/v1/crm/track/reply/${recipientId}/info`)
      .then(res => {
        const data = res.data?.data;
        setInfo(data);
        setPageState(data?.alreadyReplied ? 'already_replied' : 'ready');
      })
      .catch(() => {
        setPageState('error');
        setErrorMsg('This reply link is invalid or has expired.');
      });
  }, [recipientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !recipientId) return;

    setPageState('sending');
    try {
      await axios.post(`${API}/v1/crm/track/reply/${recipientId}`, { message: message.trim() });
      setPageState('sent');
    } catch {
      setPageState('error');
      setErrorMsg('Failed to send your message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-600 mb-3">
            <Send className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-gray-500">Lead360</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="font-semibold text-gray-800">Something went wrong</p>
              <p className="text-sm text-gray-500">{errorMsg}</p>
            </div>
          )}

          {/* Already replied */}
          {pageState === 'already_replied' && info && (
            <div className="p-8 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-800">Already replied</p>
              <p className="text-sm text-gray-500">
                Hi {info.contactName}, you already sent a reply to <strong>{info.campaignName}</strong>.
                {info.repliedAt && (
                  <> It was received on {new Date(info.repliedAt).toLocaleDateString()}.</>
                )}
              </p>
              <p className="text-xs text-gray-400 pt-2">
                Want to send another message? Contact us directly.
              </p>
            </div>
          )}

          {/* Reply form */}
          {pageState === 'ready' && info && (
            <>
              <div className="px-8 pt-8 pb-4 border-b border-gray-50">
                <h1 className="text-lg font-bold text-gray-900">Reply to {info.campaignName}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Hi {info.contactName} — write your message below and our team will get back to you.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Your message
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your reply here…"
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{message.length}/2000</p>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                  Send Reply
                </button>
              </form>
            </>
          )}

          {/* Sending */}
          {pageState === 'sending' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              <p className="text-sm text-gray-500">Sending your message…</p>
            </div>
          )}

          {/* Success */}
          {pageState === 'sent' && info && (
            <div className="p-8 text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Message received!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Thank you, {info.contactName}. Your reply to <strong>{info.campaignName}</strong> has been
                  saved and our team will get back to you shortly.
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">You can now close this tab.</p>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Lead360 AI
        </p>
      </div>
    </div>
  );
}
