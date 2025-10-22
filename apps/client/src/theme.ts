import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    ':root': {
      colorScheme: 'dark'
    },
    body: {
      bg: '#0f111a',
      color: '#f5f7ff',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  },
  theme: {
    tokens: {
      colors: {
        'app.surface': { value: '#151826' },
        'app.surfaceMuted': { value: '#1f2233' },
        'app.surfaceActive': { value: '#272b3d' },
        'app.accent': { value: '#5eead4' },
        'app.accentMuted': { value: '#2dd4bf' },
        'app.textMuted': { value: '#93c5fd' },
        'app.error': { value: '#f87171' },
        'app.warning': { value: '#fbbf24' },
        'app.success': { value: '#34d399' }
      },
      radii: {
        card: { value: '1.25rem' }
      },
      shadows: {
        card: { value: '0 18px 60px rgba(15, 17, 26, 0.45)' }
      }
    }
  }
});

export const theme = createSystem(defaultConfig, config);
