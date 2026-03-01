// consistent theme

export const Theme = {

  // colors
  colors: {
    background: '#FAF8F3',     // app bg
    white: '#FFFFFF',
    text: '#3A3A3A',           // text color
    textSecondary: '#8E8E93',  // dimmed text for captions
    primary: '#1E3A6E',        // buttons
    secondary: '#E8DFC8',      // accents
    accentBlue: '#D4E4F7',     // pill
    accentText: '#2C5282',     // links
    border: '#E8DFC8',         // norder
    borderLight: 'rgba(58,58,58,0.12)', // ddivider lines
    error: '#FF3B30',          // errors
    success: '#34C759',        // confirmation
    pillBg: 'rgba(30,58,110,0.92)', // behind the nav
    pillActive: '#D4E4F7',     // icon inside the nav
  },

  // border
  radius: {
    sm: 10,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 100, 
  },

  // shadows
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2, 
    },
    lifted: {
      // strong shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    pill: { // navy pill
      shadowColor: '#1E3A6E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 10,
    },
  },

  typography: {
    defaultFontSize: 20,
    defaultLineHeightMultiplier: 1.7, 
    defaultLetterSpacing: 0.5,        
  },
};