/**
 * Ant Design v5 Theme Token Configuration
 * Strictly aligned with DESIGN.md & Stitch Design System tokens
 */
export const antdTheme = {
  token: {
    colorPrimary: '#4F46E5',       // Royal Indigo
    colorSuccess: '#10B981',       // Emerald (Available / Completed)
    colorWarning: '#F59E0B',       // Amber (Holding 15m / Pending)
    colorError: '#EF4444',         // Rose (Dispute / Cancelled / Strike)
    colorInfo: '#3B82F6',          // Escrow Blue (Scheduled / Progress)
    colorTextBase: '#0F172A',      // Slate 900
    colorBgBase: '#FFFFFF',
    fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    borderRadius: 8,
    controlHeight: 40,
    boxShadowSecondary: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
  },
  components: {
    Button: {
      colorPrimary: '#4F46E5',
      primaryShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
      borderRadius: 8,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 12,
      headerBg: 'transparent',
    },
    Table: {
      borderRadius: 10,
      headerBg: '#F8FAFC',
      headerColor: '#475569',
      rowHoverBg: '#F1F5F9',
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Badge: {
      fontFamily: '"JetBrains Mono", monospace',
    },
  },
};
