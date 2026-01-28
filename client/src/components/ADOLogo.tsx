import { useTheme } from '@/components/theme-provider';

export function ADOLogo({ className = '' }: { className?: string }) {
  const { theme } = useTheme();

  // Determine which logo to show based on theme
  // In dark mode, use white logo; in light mode, use dark logo
  // For system theme, check the actual computed preference
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const logoSrc = isDark ? '/logo-dark.png' : '/logo-white.png';

  return (
    <img
      src={logoSrc}
      alt="ADO - Automotive Data & AI Office"
      className={className}
    />
  );
}
