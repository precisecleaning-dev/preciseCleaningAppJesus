// src/theme/tokens.ts
// ⭐ SISTEMA DE DISEÑO — Precise Cleaning (app de empleados).
//
//    Dirección: el azul de la marca Precise Cleaning como base, llevado a un
//    degradado azul → índigo en los encabezados, y una paleta de ACENTOS con
//    significado fijo para que el color "hable" en toda la app:
//
//      sky     → por hacer / agenda        violet → en curso
//      mint    → terminado / pagado        amber  → fotos y pendientes
//      coral   → atrasado / alertas        teal   → notas y mensajes
//
//    Regla: un color de acento NUNCA se usa como decoración suelta; siempre
//    marca uno de esos significados. Así se lee el estado de un vistazo.
//    TODO valor fijo de color, tamaño o tipografía sale de este archivo.

export const palette = {
  brand: '#1570EF',
  brandDeep: '#0B4FC4',
  indigo: '#4F46E5',
  ink: '#0B1B33',
  ink2: '#334155',
  muted: '#64748B',
  soft: '#94A3B8',
  line: '#E6EBF2',
  canvas: '#F4F7FC',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
};

/** Acentos semánticos: color fuerte + tinte suave para fondos. */
export const accents = {
  sky: { solid: '#0EA5E9', soft: '#E0F2FE', ink: '#0369A1' },
  violet: { solid: '#8B5CF6', soft: '#EDE9FE', ink: '#6D28D9' },
  mint: { solid: '#10B981', soft: '#D1FAE5', ink: '#047857' },
  amber: { solid: '#F59E0B', soft: '#FEF3C7', ink: '#B45309' },
  coral: { solid: '#F43F5E', soft: '#FFE4E6', ink: '#BE123C' },
  teal: { solid: '#14B8A6', soft: '#CCFBF1', ink: '#0F766E' },
  brand: { solid: '#1570EF', soft: '#E3EEFF', ink: '#0B4FC4' },
} as const;

export type AccentName = keyof typeof accents;

export const colors = {
  primary: palette.brand,
  primaryDark: palette.brandDeep,
  primarySoft: accents.brand.soft,
  bg: palette.canvas,
  surface: palette.surface,
  border: palette.line,
  text: palette.ink,
  textBody: palette.ink2,
  textMuted: palette.muted,
  textSoft: palette.soft,
  success: accents.mint.solid,
  successSoft: accents.mint.soft,
  warning: accents.amber.ink,
  warningSoft: accents.amber.soft,
  danger: accents.coral.solid,
  dangerSoft: accents.coral.soft,
  white: palette.white,
  overlay: 'rgba(11, 27, 51, 0.88)',
  glass: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
  onBrandMuted: 'rgba(255, 255, 255, 0.78)',
  shadow: '#1B2F5C',
};

/** Degradados (siempre de arriba-izquierda a abajo-derecha). */
export const gradients = {
  brand: ['#1570EF', '#4F46E5'] as const,
  brandSoft: ['#2B7FFF', '#6D5DF6'] as const,
  mint: ['#10B981', '#0EA5E9'] as const,
  violet: ['#8B5CF6', '#EC4899'] as const,
  amber: ['#F59E0B', '#F43F5E'] as const,
  shimmer: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)'] as const,
};

export const space = { xxs: 4, xs: 6, sm: 10, md: 14, lg: 20, xl: 28, xxl: 40 };

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

/** Plus Jakarta Sans: una familia por peso (en RN fontWeight no elige archivo). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  number: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontVariant: ['tabular-nums' as const] },
};

export type TypeVariant = keyof typeof type;

/** Sombras suaves y frías (tinte azul de la marca, no gris puro). */
export const shadow = {
  card: { shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  raised: { shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
};

/** 48 px: mínimo táctil de Material / WCAG 2.2. */
export const touchMin = 48;

/** Duraciones y resortes compartidos: el movimiento se siente igual en toda la app. */
export const motion = {
  fast: 160,
  base: 260,
  slow: 420,
  spring: { damping: 16, stiffness: 180, mass: 0.9 },
  springSoft: { damping: 20, stiffness: 120 },
  stagger: 55,
};

/** Espacio libre al final de las listas para que la barra flotante no tape contenido. */
export const TAB_BAR_SPACE = 120;
