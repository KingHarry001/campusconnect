// capacitor.config.ts — add the plugins block
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ng.edu.oouagoiwoye.campusconnect',
  appName: 'Campus Connect',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A0A0A",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;