export const colors = {
  // Backgrounds
  white: '#FFFFFF',
  offWhite: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFF',

  // Ink / Text
  ink: '#0F172A',
  ink2: '#1E293B',
  muted: '#64748B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  borderFocus: '#2563EB',

  // Primary brand — Electric Blue
  electric: '#2563EB',
  electricLight: '#EFF6FF',
  electricDark: '#1D4ED8',
  electricText: '#FFFFFF',

  // Phase 1 — Sky Blue
  sky: '#0EA5E9',
  skyLight: '#E0F2FE',
  skyDark: '#0284C7',

  // Phase 2 / Success — Mint
  mint: '#10B981',
  mintLight: '#ECFDF5',
  mintDark: '#059669',

  // Highlight — Yellow
  highlight: '#FDE68A',
  highlightText: '#92400E',

  // Risk / Warning — Coral
  coral: '#EF4444',
  coralLight: '#FEE2E2',
  coralDark: '#DC2626',

  // Warning — Amber
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  amberDark: '#D97706',

  // AI / Insights — Purple
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',

  // Notebook lines (for background pattern)
  notebookLine: 'rgba(147, 197, 253, 0.30)',
  notebookMargin: 'rgba(239, 68, 68, 0.40)',

  // Status colors
  statusDraft: '#94A3B8',
  statusInProgress: '#0EA5E9',
  statusComplete: '#10B981',
  statusArchived: '#64748B',
} as const;

export type ColorKey = keyof typeof colors;
