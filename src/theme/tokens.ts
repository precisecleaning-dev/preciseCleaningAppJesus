// src/theme/tokens.ts
// ⭐ Paleta slate/blue de la app web (primario #3b82f6). Equivale a
//    src/styles/tokens.css: TODO color, tamaño o espaciado fijo sale de aquí,
//    nunca escrito a mano dentro de un componente.
export const colors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primarySoft: '#eff6ff',
  bg: '#f1f5f9',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textSoft: '#94a3b8',
  success: '#16a34a',
  successSoft: '#dcfce7',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  white: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.85)',
};

export const space = { xxs: 4, xs: 6, sm: 10, md: 14, lg: 20, xl: 28 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const font = { xs: 12, sm: 13, base: 15, md: 17, lg: 20, xl: 26 };

/** 48 px: mínimo táctil de Material / WCAG 2.2 — igual que --touch-min en la web. */
export const touchMin = 48;
