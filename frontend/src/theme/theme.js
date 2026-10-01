import { createTheme } from '@mui/material/styles';
import { forwardRef } from 'react';

// No-op transition to disable dialog animations
const NoTransition = forwardRef(function NoTransition({ children, in: inProp }, ref) {
  return inProp ? children : null;
});


/**
 * Navy Blue & White design system for an enterprise logistics dashboard.
 * Built as a factory so ThemeModeContext can regenerate it on dark-mode toggle.
 *
 * Palette: navy blue is the single dominant accent (brand, actions, active
 * states); white/near-white surfaces everywhere else. No secondary accent
 * color - status colors (success/warning/error/info) are used sparingly
 * for chips and alerts only.
 */
export function buildTheme(mode) {
  const isDark = mode === 'dark';

  // Transport-brand blue: sky -> blue -> deep navy, matching the new
  // login / dashboard / sidebar design.
  const blue = {
    main: '#2563EB',
    light: '#3B82F6',
    dark: '#1E40AF',
    contrastText: '#FFFFFF',
  };

  return createTheme({
    palette: {
      mode,
      primary: blue,
      secondary: { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7', contrastText: '#FFFFFF' },
      success: { main: '#16A34A' },
      warning: { main: '#D97706' },
      error: { main: '#DC2626' },
      info: { main: '#0EA5E9' },
      background: {
        default: isDark ? '#0B1220' : '#F1F5F9',
        paper: isDark ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#E2E8F0' : '#0F1A2B',
        secondary: isDark ? '#94A3B8' : '#64748B',
      },
      divider: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(37,99,235,0.12)',
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: ['"Inter Variable"', '"Inter"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      h4: { fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontWeight: 700, letterSpacing: -0.3 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12.5 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(37,99,235,0.06)',
      '0px 2px 8px rgba(37,99,235,0.08)',
      '0px 6px 16px rgba(37,99,235,0.10)',
      ...Array(21).fill('0px 12px 28px rgba(37,99,235,0.12)'),
    ],
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 9, paddingInline: 18 },
          sizeMedium: { paddingTop: 8, paddingBottom: 8 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 60%, #1E40AF 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0284C7 0%, #1D4ED8 60%, #1E3A8A 100%)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(37,99,235,0.10)'}`,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              fontWeight: 700,
              fontSize: 12.5,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              color: isDark ? '#94A3B8' : '#64748B',
              backgroundColor: isDark ? 'rgba(148,163,184,0.05)' : 'rgba(37,99,235,0.04)',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(37,99,235,0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'medium' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#081527' : '#FFFFFF',
            borderRadius: '0 !important',
            border: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#081527' : '#FFFFFF',
            borderBottom: `1px solid ${isDark ? 'rgba(143,163,191,0.12)' : 'rgba(10,47,92,0.10)'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            marginInline: 8,
            marginBottom: 2,
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          TransitionComponent: NoTransition,
          transitionDuration: 0,
        },
        styleOverrides: {
          paper: {
            borderRadius: 14,
            border: `1px solid ${isDark ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.07)'}`,
            '@media (max-width: 600px)': {
              margin: 8,
              maxHeight: 'calc(100% - 16px)',
              width: 'calc(100% - 16px)',
              maxWidth: '100%',
              borderRadius: 10,
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            fontSize: '1.25rem',
            paddingBottom: 8,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            paddingTop: '12px !important',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            transition: 'none !important',
          },
        },
      },
    },
  });
}
