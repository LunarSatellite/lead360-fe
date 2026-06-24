import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Link2,
  Sun,
  GitBranch,
  MessageSquare,
  Users,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Particle canvas background — auto-tunes density for mobile
   ═══════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const pts: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    // Fewer particles on small screens — saves battery + paint cost
    const COUNT = window.innerWidth < 640 ? 25 : 60;
    const LINK_DIST = window.innerWidth < 640 ? 80 : 120;

    function resize() {
      c!.width = c!.offsetWidth;
      c!.height = c!.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      pts.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, c!.width, c!.height);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = c!.width;
        if (p.x > c!.width) p.x = 0;
        if (p.y < 0) p.y = c!.height;
        if (p.y > c!.height) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(0,255,170,.25)';
        ctx!.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.strokeStyle = `rgba(0,255,170,${0.12 * (1 - d / LINK_DIST)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute top-0 left-0 w-full pointer-events-none z-[1]"
      style={{ height: 700 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   Reusable components
   ═══════════════════════════════════════════════════════ */
function SectionTag({ children }: { children: React.ReactNode }) {
  return <span className="landing-sec-tag">{children}</span>;
}

function CtaButton({
  children,
  to,
  large,
  fullWidthOnMobile = true,
}: {
  children: React.ReactNode;
  to: string;
  large?: boolean;
  fullWidthOnMobile?: boolean;
}) {
  const sizeClasses = large
    ? 'text-[14px] sm:text-[17px] py-[13px] sm:py-[18px] px-[24px] sm:px-[52px]'
    : 'text-[14px] sm:text-[15px] py-[12px] sm:py-[14px] px-[24px] sm:px-[36px]';
  return (
    <Link
      to={to}
      className={`landing-cta justify-center ${sizeClasses} ${fullWidthOnMobile ? 'w-full sm:w-auto' : 'max-w-full'}`}
    >
      <span className="landing-beam" />
      {children}
    </Link>
  );
}

function GhostButton({
  children,
  href,
  to,
  fullWidthOnMobile = true,
}: {
  children: React.ReactNode;
  href?: string;
  to?: string;
  fullWidthOnMobile?: boolean;
}) {
  const cls = `landing-cta2 justify-center !py-[12px] !px-[28px] sm:!py-[14px] sm:!px-[36px] !text-[14px] sm:!text-[15px] ${fullWidthOnMobile ? 'w-full sm:w-auto' : ''}`;
  if (to)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════
   Channel showcase data
   ═══════════════════════════════════════════════════════ */
const CHANNEL_TABS = [
  { name: 'WhatsApp', icon: '💬', color: '#25D366', type: 'Rich interactive' },
  { name: 'Instagram', icon: '📸', color: '#E4405F', type: 'DM + Stories' },
  { name: 'Facebook', icon: '📘', color: '#1877F2', type: 'Quick replies + Cards' },
  { name: 'Telegram', icon: '✈️', color: '#2AABEE', type: 'Inline keyboards' },
  { name: 'Email', icon: '✉️', color: '#F43F5E', type: 'Templates + Threads' },
  { name: 'Voice', icon: '🎙️', color: '#A78BFA', type: 'IVR + Voice-to-text' },
  { name: 'Web chat', icon: '🌐', color: '#60A5FA', type: 'Embed widget' },
  { name: 'SMS', icon: '📱', color: '#FBBF24', type: 'Text-only' },
];

/* ─── Per-channel native UI screens ─── */
function WhatsAppScreen() {
  return (
    <>
      <div className="ch-bub ch-bub-u ch-mp">Show me your menu</div>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#25D36618' }}>
        Here's what I can help with:
      </div>
      <div
        className="ch-mp"
        style={{ border: '1px solid #25D36630', borderRadius: 12, overflow: 'hidden', marginBottom: 6 }}
      >
        <div
          style={{
            padding: '6px 12px',
            fontSize: 10,
            fontWeight: 700,
            color: '#25D366',
            borderBottom: '1px solid #25D36620',
          }}
        >
          Main menu
        </div>
        {['Browse products', 'Track my order', 'Talk to support'].map((t) => (
          <div
            key={t}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: '#8FAEA0',
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #0A0D0C',
            }}
          >
            <span>{t}</span>
            <span style={{ color: '#25D366', fontSize: 10 }}>&gt;</span>
          </div>
        ))}
      </div>
      <div className="ch-mp" style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {['Browse', 'Track', 'Help'].map((t) => (
          <span
            key={t}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 600,
              textAlign: 'center',
              background: '#25D36620',
              color: '#25D366',
              border: '1px solid #25D36630',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </>
  );
}

function InstagramScreen() {
  return (
    <>
      <div className="ch-mp" style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        {['🛍️', '👟', '👗', '🎒'].map((e, i) => (
          <div
            key={i}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              background: i === 0 ? '#E4405F20' : '#E4405F10',
              border: `2px solid ${i === 0 ? '#E4405F' : '#E4405F30'}`,
            }}
          >
            {e}
          </div>
        ))}
      </div>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#E4405F18' }}>
        Hey! 👋 Saw you checked our latest drop. Need help finding your size?
      </div>
      <div className="ch-bub ch-bub-u ch-mp">Yes, looking for sneakers</div>
      <div
        className="ch-mp"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}
      >
        {[1, 2].map((i) => (
          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E4405F30' }}>
            <div
              style={{
                height: 60,
                background: 'linear-gradient(135deg, #E4405F, #F77737)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              👟
            </div>
            <div style={{ padding: 6, fontSize: 9, color: '#8FAEA0' }}>
              <div style={{ fontWeight: 700, color: '#E6F5ED' }}>Air Max #{i}</div>
              <div>$129</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FacebookScreen() {
  return (
    <>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#1877F218' }}>
        Hi! How can I help today?
      </div>
      <div
        className="ch-mp"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}
      >
        {['📦 Track order', '🛍️ Browse', '💬 Support', '⭐ Reviews'].map((t) => (
          <div
            key={t}
            style={{
              padding: '8px 12px',
              borderRadius: 18,
              background: '#1877F215',
              border: '1px solid #1877F230',
              color: '#1877F2',
              fontSize: 11,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="ch-bub ch-bub-u ch-mp">Track my order</div>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#1877F218' }}>
        Order #4821 is on the way! 📦 ETA: 3:00 PM today.
      </div>
    </>
  );
}

function TelegramScreen() {
  return (
    <>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#2AABEE18', borderRadius: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2AABEE', marginBottom: 4 }}>Lead360 Bot</div>
        Choose an action:
      </div>
      <div
        className="ch-mp"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}
      >
        {['/start', '/menu', '/orders', '/help'].map((t) => (
          <div
            key={t}
            style={{
              padding: '8px',
              borderRadius: 8,
              background: '#0A0D0C',
              border: '1px solid #2AABEE40',
              color: '#2AABEE',
              fontSize: 11,
              fontFamily: 'monospace',
              textAlign: 'center',
            }}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="ch-bub ch-bub-u ch-mp">/menu</div>
      <div className="ch-bub ch-bub-b ch-mp" style={{ background: '#2AABEE18' }}>
        ✅ Browse products
        <br />
        🛒 View cart
        <br />
        📞 Contact support
      </div>
    </>
  );
}

function EmailScreen() {
  return (
    <div className="ch-mp" style={{ border: '1px solid #F43F5E30', borderRadius: 12, overflow: 'hidden' }}>
      <div
        style={{
          padding: '8px 12px',
          background: '#F43F5E10',
          borderBottom: '1px solid #F43F5E20',
          fontSize: 10,
          color: '#8FAEA0',
        }}
      >
        <div style={{ fontWeight: 700, color: '#E6F5ED' }}>Re: Your order #4821</div>
        <div style={{ fontSize: 9, marginTop: 2 }}>From: support@omniflow.ai</div>
      </div>
      <div style={{ padding: 12, fontSize: 11, color: '#8FAEA0', lineHeight: 1.6 }}>
        Hi Alex,
        <br />
        <br />
        Your order is on the way! 📦
        <br />
        <br />
        <span style={{ color: '#F43F5E', fontWeight: 700 }}>Tracking:</span> 1Z999AA1234567890
        <br />
        <span style={{ color: '#F43F5E', fontWeight: 700 }}>ETA:</span> Tomorrow, 3:00 PM
        <br />
        <br />
        Need help? <span style={{ color: '#F43F5E', textDecoration: 'underline' }}>Reply to this email</span>
      </div>
    </div>
  );
}

function VoiceScreen() {
  return (
    <>
      <div
        className="ch-mp"
        style={{
          textAlign: 'center',
          padding: 16,
          background: '#A78BFA10',
          borderRadius: 16,
          border: '1px solid #A78BFA30',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 6 }}>🎙️</div>
        <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>Voice call active</div>
        <div style={{ fontSize: 10, color: '#4D6E5F', marginTop: 4 }}>00:42</div>
      </div>
      {[
        { who: 'You', text: '"I want to track my order"', color: '#8FAEA0' },
        { who: 'Bot', text: '"Sure! What\'s your order number?"', color: '#A78BFA' },
        { who: 'You', text: '"Four eight two one"', color: '#8FAEA0' },
      ].map((m, i) => (
        <div
          key={i}
          className="ch-mp"
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: m.color, minWidth: 30 }}>{m.who}</span>
          <span style={{ fontSize: 11, color: '#8FAEA0', flex: 1, fontStyle: 'italic' }}>{m.text}</span>
        </div>
      ))}
    </>
  );
}

function WebChatScreen() {
  return (
    <div className="ch-mp" style={{ border: '1px solid #60A5FA30', borderRadius: 14, overflow: 'hidden' }}>
      <div
        style={{
          padding: '8px 12px',
          background: '#60A5FA10',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #60A5FA20',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#050808',
            fontWeight: 800,
          }}
        >
          O
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Lead360 Bot</div>
          <div style={{ fontSize: 9, color: '#4D6E5F' }}>Online</div>
        </div>
      </div>
      <div style={{ padding: 10 }}>
        <div
          className="ch-bub ch-bub-b"
          style={{ background: '#60A5FA18', maxWidth: '100%', marginBottom: 6 }}
        >
          Hi! I'm your AI assistant. How can I help?
        </div>
        <div className="ch-bub ch-bub-u" style={{ marginBottom: 6 }}>
          I need help with my order
        </div>
        <div
          className="ch-bub ch-bub-b"
          style={{ background: '#60A5FA18', maxWidth: '100%', marginBottom: 6 }}
        >
          Sure! Enter your order number below.
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <div
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              background: '#0A0D0C',
              border: '1px solid #132A21',
              fontSize: 10,
              color: '#4D6E5F',
            }}
          >
            Type order number...
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#60A5FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#050808',
            }}
          >
            →
          </div>
        </div>
      </div>
    </div>
  );
}

function SMSScreen() {
  return (
    <>
      <div
        className="ch-mp"
        style={{ fontSize: 11, color: '#4D6E5F', textAlign: 'center', marginBottom: 10 }}
      >
        Text message conversation
      </div>
      {[
        { from: 'bot', text: 'Welcome to ShopBot! Reply with:\nTRACK, BROWSE, or HELP' },
        { from: 'user', text: 'TRACK' },
        { from: 'bot', text: 'Enter your order number:' },
        { from: 'user', text: '4821' },
        { from: 'bot', text: 'Order #4821: Out for delivery.\nETA 3:00 PM.\nReply DETAILS for more.' },
      ].map((m, i) => (
        <div
          key={i}
          className="ch-mp"
          style={{
            padding: '8px 12px',
            borderRadius: 14,
            fontSize: 12,
            lineHeight: 1.5,
            maxWidth: '90%',
            marginBottom: 6,
            whiteSpace: 'pre-line',
            ...(m.from === 'user'
              ? { alignSelf: 'flex-end', background: '#1B2E25', color: '#8FAEA0', borderBottomRightRadius: 4 }
              : {
                  alignSelf: 'flex-start',
                  background: '#FBBF2418',
                  color: '#FBBF24',
                  borderBottomLeftRadius: 4,
                  border: '1px solid #FBBF2430',
                }),
          }}
        >
          {m.text}
        </div>
      ))}
    </>
  );
}

const SCREENS = [
  WhatsAppScreen,
  InstagramScreen,
  FacebookScreen,
  TelegramScreen,
  EmailScreen,
  VoiceScreen,
  WebChatScreen,
  SMSScreen,
];

/* ─── Channel showcase component ─── */
function ChannelShowcase() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const goTo = useCallback((n: number) => {
    setActive(n);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % CHANNEL_TABS.length), 4000);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % CHANNEL_TABS.length), 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const ch = CHANNEL_TABS[active];
  const Screen = SCREENS[active];

  return (
    <section
      id="channels"
      className="relative z-10 px-5 sm:px-10 lg:px-14 py-16 sm:py-20 lg:py-24 border-t border-[#132A21]"
    >
      <div className="text-center mb-8 sm:mb-10">
        <SectionTag>Channels</SectionTag>
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-1.5px] sm:tracking-[-2px] leading-[1.05] mt-4 sm:mt-5 text-text-primary">
          Same bot, <span className="text-brand">native everywhere</span>
        </h2>
      </div>

      {/* Tab navigation — horizontal scroll on mobile (with viewport-edge bleed), centered wrap on sm+ */}
      <div
        className="flex sm:justify-center gap-2 mb-6 sm:mb-8 overflow-x-auto sm:flex-wrap pb-2 sm:pb-0
                      px-5 sm:px-0 sm:mx-auto sm:max-w-[680px]
                      max-sm:-mx-5
                      [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {CHANNEL_TABS.map((c, i) => (
          <button
            key={c.name}
            onClick={() => goTo(i)}
            className={`ch-tab whitespace-nowrap flex-shrink-0 ${active === i ? 'ch-tab-on' : ''}`}
            style={{ '--cc': c.color } as React.CSSProperties}
          >
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Device frame */}
      <div className="ch-device" style={{ '--dc': ch.color } as React.CSSProperties}>
        <div className="ch-device-bar">
          <div className="flex items-center gap-2">
            <span className="w-[10px] h-[10px] rounded-full" style={{ background: ch.color }} />
            <span className="text-xs font-bold" style={{ color: ch.color }}>
              {ch.name}
            </span>
          </div>
          <span className="text-[9px] text-[#4D6E5F] font-medium">{ch.type}</span>
        </div>
        <div className="ch-device-body" key={active}>
          <Screen />
        </div>
      </div>

      <p className="text-center text-xs sm:text-[13px] text-[#4D6E5F] mt-5 sm:mt-6 px-4">
        Same bot logic — different native UI per channel. Auto-cycles or tap to explore.
      </p>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat-first setup',
    desc: 'No forms, no config files. Just tell our AI about your business in plain language — it handles the rest.',
    color: 'rgba(0,255,170,.08)',
    stroke: '#00FFAA',
  },
  {
    icon: Link2,
    title: 'Instant extraction',
    desc: 'Paste your website URL or upload a doc — the AI reads it and fills in your products, hours, and FAQs automatically.',
    color: 'rgba(96,165,250,.08)',
    stroke: '#60A5FA',
  },
  {
    icon: GitBranch,
    title: 'Visual flow builder',
    desc: 'Want more control? Edit your bot\'s conversation flow visually — any time, without touching the chat.',
    color: 'rgba(167,139,250,.08)',
    stroke: '#A78BFA',
  },
  {
    icon: Sun,
    title: 'Multi-channel deploy',
    desc: 'WhatsApp, Messenger, Instagram, SMS, Web chat — one bot, native UI on every channel.',
    color: 'rgba(251,191,36,.08)',
    stroke: '#FBBF24',
  },
  {
    icon: Users,
    title: 'Agent handoff',
    desc: 'When the bot can\'t help, it escalates to a human — with full conversation context, instantly.',
    color: 'rgba(244,63,94,.08)',
    stroke: '#F43F5E',
  },
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    desc: 'See resolution rates, conversation volume, and channel health — all in one dashboard.',
    color: 'rgba(52,211,153,.08)',
    stroke: '#34D399',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Tell us about your business',
    desc: 'Start a chat with our AI. Describe what you sell, your operating hours, and how you want to help customers — in your own words.',
  },
  {
    num: '02',
    title: 'Share what you already have',
    desc: 'Got a website or a document? Paste the URL or upload it — the AI reads it and extracts your products, FAQs, and policies automatically.',
  },
  {
    num: '03',
    title: 'Review and refine',
    desc: 'See your bot take shape in real time. Correct anything, add details, or ask for changes — all through the same conversation.',
  },
  {
    num: '04',
    title: 'Pick your channels',
    desc: 'Choose where your customers are — WhatsApp, Messenger, Instagram, SMS, Web chat. The bot adapts its UI to each channel automatically.',
  },
  {
    num: '05',
    title: 'Go live',
    desc: 'Deploy in one click. Customers start chatting immediately. Monitor conversations, resolution rates, and agent handoffs from the dashboard.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    features: ['1 channel', '100 conversations/mo', '10 intents'],
    cta: 'Get started',
    primary: false,
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/mo',
    features: ['3 channels', '5,000 conversations/mo', 'Unlimited intents', 'AI flow builder'],
    cta: 'Start free trial',
    primary: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'talk to us',
    features: ['Unlimited channels', 'Unlimited conversations', 'Custom LLM models', 'SLA guarantee'],
    cta: 'Contact sales',
    primary: false,
  },
];

const NAV_LINKS = ['Features', 'How it works', 'Channels', 'Pricing'];

/* ═══════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════ */
export function Component() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#050808] text-[#E6F5ED] font-sans overflow-x-hidden relative">
      <ParticleCanvas />

      {/* ─── NAV ─── */}
      <nav className="relative z-30 flex items-center justify-between px-5 sm:px-10 lg:px-14 py-4 sm:py-5">
        <Link to="/" className="group flex items-center gap-3">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-[#050808] flex items-center justify-center p-1">
            <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">Lead360</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {NAV_LINKS.map((t) => (
            <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-')}`} className="landing-nav-link">
              {t}
            </a>
          ))}
        </div>

        {/* Right cluster — Sign in + Get started + (hamburger on mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <Link
            to="/auth/login"
            className="text-xs sm:text-sm font-medium text-text-muted hover:text-[#00D97E] transition-colors px-1"
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="landing-cta text-[12px] sm:text-[13px] py-[8px] sm:py-[10px] px-[14px] sm:px-[20px] lg:px-[24px]"
          >
            <span className="landing-beam" />
            <span className="hidden sm:inline lg:hidden">Start</span>
            <span className="sm:hidden">Start</span>
            <span className="hidden lg:inline">Get started</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Mobile hamburger — for nav links only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 sm:p-2 -mr-1 sm:-mr-2 rounded-lg text-text-primary hover:bg-[#0B1210] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU OVERLAY (just section nav links) ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#050808]/95 backdrop-blur-md flex flex-col animate-[fadeIn_0.2s_ease]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#132A21]">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#050808] flex items-center justify-center p-1">
                <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-text-primary">Lead360</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 rounded-lg text-text-primary hover:bg-[#0B1210] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-1 p-5">
            {NAV_LINKS.map((t) => (
              <a
                key={t}
                href={`#${t.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-4 rounded-xl text-base font-semibold text-text-primary hover:bg-[#0B1210] transition-colors"
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-14 pt-14 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 text-center">
        <div className="landing-hero-blob" />
        <div className="landing-orb-ring">
          <div
            className="landing-orbit-dot"
            style={{
              background: '#00FFAA',
              boxShadow: '0 0 12px #00FFAA',
              animation: 'landing-orbit 10s linear infinite',
            }}
          />
          <div
            className="landing-orbit-dot"
            style={{
              width: 6,
              height: 6,
              background: '#60A5FA',
              boxShadow: '0 0 10px #60A5FA',
              animation: 'landing-orbit2 14s linear infinite',
            }}
          />
          <div
            className="landing-orbit-dot"
            style={{
              width: 8,
              height: 8,
              background: '#A78BFA',
              boxShadow: '0 0 10px #A78BFA',
              animation: 'landing-orbit3 8s linear infinite',
            }}
          />
        </div>

        <div className="landing-d1 mb-6 sm:mb-9">
          <SectionTag>
            <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block landing-pulse-ring" />
            Now in public beta
          </SectionTag>
        </div>

        <h1 className="landing-d2 text-[36px] sm:text-[56px] md:text-[68px] lg:text-[76px] font-black leading-[0.95] tracking-[-1.5px] sm:tracking-[-3px] lg:tracking-[-4px] max-w-[800px] mx-auto text-text-primary">
          Build AI chatbots
          <br />
          <span className="landing-shimmer-text">for any channel</span>
        </h1>

        <p className="landing-d3 text-sm sm:text-base lg:text-lg text-text-secondary mt-5 sm:mt-7 lg:mt-8 max-w-[500px] mx-auto leading-relaxed font-normal px-2">
          Just have a conversation. Tell our AI about your business and it builds a working chatbot — ready to
          deploy on WhatsApp, SMS, Web, and more. No code, no forms.
        </p>

        {/* CTAs — stack on mobile, row on tablet+ */}
        <div className="landing-d4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 mt-8 sm:mt-11 max-w-[420px] sm:max-w-none mx-auto">
          <CtaButton to="/auth/register">
            Start building free <ArrowRight className="w-5 h-5" />
          </CtaButton>
          <GhostButton href="#how-it-works">Watch demo</GhostButton>
        </div>
      </section>

      {/* ─── CHANNEL SHOWCASE ─── */}
      <ChannelShowcase />

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        className="relative z-10 px-5 sm:px-10 lg:px-14 py-16 sm:py-20 lg:py-24 border-t border-[#132A21]"
      >
        <div className="text-center mb-10 sm:mb-14">
          <SectionTag>How it works</SectionTag>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-1.5px] sm:tracking-[-2px] leading-[1.05] mt-4 sm:mt-5 text-text-primary">
            From conversation
            <br />
            to <span className="text-brand">live chatbot</span>
          </h2>
        </div>
        <div className="max-w-[640px] mx-auto">
          {STEPS.map((s) => (
            <div key={s.num} className="landing-step-row">
              <div className="landing-step-n">{s.num}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] sm:text-[17px] font-bold mb-1 sm:mb-1.5 text-text-primary">
                  {s.title}
                </div>
                <div className="text-xs sm:text-sm text-[#8FAEA0] leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="features"
        className="relative z-10 px-5 sm:px-10 lg:px-14 py-16 sm:py-20 lg:py-24 border-t border-[#132A21]"
      >
        <div className="text-center mb-10 sm:mb-14">
          <SectionTag>Platform</SectionTag>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-1.5px] sm:tracking-[-2px] leading-[1.05] mt-4 sm:mt-5 text-text-primary">
            Everything you need
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-[860px] mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing-feat" style={{ padding: 24 }}>
              <div className="landing-feat-ico" style={{ background: f.color }}>
                <f.icon
                  className="w-5 h-5 sm:w-6 sm:h-6 relative z-[1]"
                  style={{ color: f.stroke }}
                  strokeWidth={1.5}
                />
              </div>
              <div className="text-[15px] sm:text-base font-bold mb-1.5 sm:mb-2 text-text-primary">
                {f.title}
              </div>
              <div className="text-xs sm:text-[13px] text-[#8FAEA0] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section
        id="pricing"
        className="relative z-10 px-5 sm:px-10 lg:px-14 py-16 sm:py-20 lg:py-24 border-t border-[#132A21]"
      >
        <div className="text-center mb-10 sm:mb-14">
          <SectionTag>Pricing</SectionTag>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-1.5px] sm:tracking-[-2px] leading-[1.05] mt-4 sm:mt-5 text-text-primary">
            Start free, <span className="landing-shimmer-text">scale as you grow</span>
          </h2>
          <p className="text-sm sm:text-[15px] text-[#8FAEA0] mt-3 sm:mt-4">
            Channel access depends on your plan
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-[860px] mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`landing-price-card ${plan.primary ? 'landing-price-pop md:scale-[1.04]' : ''}`}
            >
              <div className="relative z-[1]">
                {plan.primary && (
                  <div className="inline-flex px-3 sm:px-3.5 py-1 rounded-full bg-brand-soft border border-[rgba(0,255,170,0.12)] text-[10px] sm:text-[11px] font-bold text-brand mb-3">
                    Most popular
                  </div>
                )}
                <div className="text-[11px] sm:text-xs font-semibold text-[#4D6E5F] uppercase tracking-[2px]">
                  {plan.name}
                </div>
                <div className="text-[36px] sm:text-[42px] font-black tracking-[-1.5px] sm:tracking-[-2px] my-2.5 sm:my-3 leading-none text-text-primary">
                  {plan.price}
                  {plan.period.startsWith('/') && (
                    <span className="text-sm sm:text-base font-medium text-[#4D6E5F]">{plan.period}</span>
                  )}
                </div>
                {!plan.period.startsWith('/') && (
                  <div className="text-xs sm:text-[13px] text-[#4D6E5F] mb-5 sm:mb-6">{plan.period}</div>
                )}
                <div className="flex flex-col gap-2.5 sm:gap-3 mb-6 sm:mb-7">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#8FAEA0]">
                      <Check className="w-4 h-4 text-brand shrink-0" strokeWidth={2} />
                      {f}
                    </div>
                  ))}
                </div>
                {plan.primary ? (
                  <Link
                    to="/auth/register"
                    className="landing-cta w-full justify-center rounded-[14px] py-[12px] px-[20px] text-sm"
                  >
                    <span className="landing-beam" />
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    to="/auth/register"
                    className="landing-cta2 w-full justify-center rounded-[14px] !py-[12px] !px-[20px] !text-sm"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-14 py-20 sm:py-24 lg:py-28 border-t border-[#132A21] text-center overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,255,170,.05), transparent 65%)' }}
        />
        <div className="relative">
          <h2 className="text-3xl sm:text-[42px] lg:text-[52px] font-black tracking-[-1.5px] sm:tracking-[-2px] lg:tracking-[-3px] leading-none text-text-primary">
            Ready to build your
            <br />
            <span className="landing-shimmer-text">chatbot?</span>
          </h2>
          <p className="text-sm sm:text-[17px] text-[#8FAEA0] mt-4 sm:mt-6 mb-8 sm:mb-10 px-4">
            Join teams already serving customers on every channel.
          </p>
          <div className="flex justify-center px-2">
            <CtaButton to="/auth/register" large fullWidthOnMobile={false}>
              Get started for free <ArrowRight className="w-5 h-5" />
            </CtaButton>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 sm:px-10 lg:px-14 py-6 border-t border-[#132A21]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#050808] flex items-center justify-center p-0.5">
            <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-text-primary">Lead360</span>
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:gap-8 text-xs text-text-muted">
          {['Privacy', 'Terms', 'Docs', 'Support'].map((t) => (
            <span key={t} className="hover:text-text-secondary cursor-pointer transition-colors">
              {t}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-text-muted">&copy; 2026 Lead360</span>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
