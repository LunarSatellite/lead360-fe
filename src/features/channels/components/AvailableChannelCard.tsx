import {
  Phone,
  MessageCircle,
  Camera,
  Send,
  MessageSquare,
  PhoneCall,
  Globe,
  Mail,
  // Plus,
  Vibrate
} from 'lucide-react';
import type { ChannelTypeValue } from '../types/channels.types';
import { CHANNEL_TYPE_LABEL } from '../types/channels.types';

const ICON_MAP: Record<ChannelTypeValue, typeof Phone> = {
  1: Phone,
  2: MessageCircle,
  3: Camera,
  4: Send,
  5: MessageSquare,
  6: PhoneCall,
  7: Globe,
  8: Mail,
  9: Vibrate,
};

const BRAND_COLOR: Record<ChannelTypeValue, string> = {
  1: '#25D366',
  2: '#0084FF',
  3: '#E1306C',
  4: '#2AABEE',
  5: '#6B7280',
  6: '#6B7280',
  7: '#00D97E',
  8: '#A78BFA',
  9: '#6650DF',
};

const CHANNEL_DESCRIPTION: Record<ChannelTypeValue, string> = {
  1: 'Connect via Meta Business to serve customers on WhatsApp',
  2: 'Integrate with Facebook Page Messenger',
  3: 'Respond to Instagram DMs from your business account',
  4: 'Set up a Telegram bot via @BotFather',
  5: 'Send and receive SMS via Twilio',
  6: 'AI-powered IVR for voice calls',
  7: 'Embed a chat widget on your website',
  8: 'Handle support emails with your chatbot',
  9: 'Connect via Viber Admin Panel to serve customers on Viber',
};

interface AvailableChannelCardProps {
  channelType: ChannelTypeValue;
  onConnect: (channelType: ChannelTypeValue) => void;
}

export function AvailableChannelCard({ channelType, onConnect }: AvailableChannelCardProps) {
  const Icon = ICON_MAP[channelType] ?? Globe;
  const label = CHANNEL_TYPE_LABEL[channelType];
  const color = BRAND_COLOR[channelType] || '#708A7E';
  const description = CHANNEL_DESCRIPTION[channelType];

  return (
    <div
      className="rounded-[14px] border border-dashed border-border-subtle bg-bg p-[18px]
                 flex flex-col items-center text-center gap-2
                 hover:bg-bg-shell transition-all group cursor-pointer"
      style={{ '--ch-color': color } as React.CSSProperties}
      onClick={() => onConnect(channelType)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center border"
        style={{
          background: `${color}06`,
          borderColor: `${color}0F`,
        }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color }} strokeWidth={1.5} />
      </div>

      {/* Name */}
      <div className="text-sm font-semibold text-text-primary">{label}</div>

      {/* Description */}
      <p className="text-2xs text-text-muted leading-relaxed">{description}</p>

      {/* Connect button */}
      <button
        className="mt-auto w-full py-[6px] rounded-[8px] text-2xs font-medium transition-all
                   border"
        style={{
          background: `${color}08`,
          borderColor: `${color}15`,
          color,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onConnect(channelType);
        }}
      >
        Connect
      </button>
    </div>
  );
}
