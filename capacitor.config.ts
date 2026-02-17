import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studybuddy.app',
  appName: 'StudyBuddy',
  webDir: 'dist',
  includePlugins: [],
  server: {
    cleartext: true,
    // Disable caching to ensure latest build always loads
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    limitsNavigationsToAppBoundDomains: false,
    // Let CSS handle safe areas via env(safe-area-inset-*) instead of native insets
    contentInset: 'never',
    backgroundColor: '#1E1B4B'
  }
};

export default config;
