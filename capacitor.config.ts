import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studybuddy.app',
  appName: 'StudyBuddy',
  webDir: 'dist',
  includePlugins: ['@capacitor/haptics', '@capgo/native-purchases'],
  server: {
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    // Let CSS handle safe areas via env(safe-area-inset-*) instead of native insets
    contentInset: 'never',
    backgroundColor: '#1E1B4B'
  }
};

export default config;
