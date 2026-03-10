import { useState, useEffect } from 'react';
import { Sun, Moon, Zap, Sunset } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const themes = [
    { id: 'dark', icon: <Moon size={18} />, label: 'Dark' },
    { id: 'light', icon: <Sun size={18} />, label: 'Light' },
    { id: 'neon', icon: <Zap size={18} />, label: 'Neon' },
    { id: 'sunset', icon: <Sunset size={18} />, label: 'Sunset' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          style={{
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme === t.id ? 'var(--accent-color)' : 'transparent',
            color: theme === t.id ? 'var(--bg-color)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
