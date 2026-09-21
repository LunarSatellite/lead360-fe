import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full border border-border-medium overflow-hidden"
    >
      <div
        className={`absolute inset-0 transition-all ${
          theme === 'dark' ? 'bg-brand' : 'bg-slate-300'
        }`}
      />

      <div
        className={`absolute top-1 h-6 w-6 bg-white rounded-full transition-transform flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
      >
        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
      </div>
    </button>
  );
}
