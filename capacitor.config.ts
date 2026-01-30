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
    // WebView configuration for better cache control
    contentInset: 'always'
  }
};

export default config;
