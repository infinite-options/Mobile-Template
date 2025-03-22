const path = require("path");
const { config } = require("dotenv");

// Load the environment variables from .env file
config({ path: path.resolve(__dirname, ".env") });

module.exports = ({ config: expoConfig }) => ({
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME,
    slug: process.env.EXPO_PUBLIC_APP_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [process.env.EXPO_PUBLIC_GOOGLE_URL_SCHEME],
            CFBundleURLName: "google",
          },
        ],
        NSLocationWhenInUseUsageDescription: "This app needs access to location to show it on the map.",
        NSLocationAlwaysUsageDescription: "This app needs access to location to show it on the map.",
        GMSApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      usesAppleSignIn: true,
      config: {
        usesNonExemptEncryption: false,
        signInWithAppleServicesId: process.env.EXPO_PUBLIC_APPLE_SERVICES_ID,
      },
    },
    android: {
      package: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["android.permission.ACCESS_COARSE_LOCATION", "android.permission.ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    scheme: process.env.EXPO_PUBLIC_GOOGLE_URL_SCHEME,
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_URL_SCHEME,
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
          android: {
            extraProguardRules: "-keep class com.google.android.gms.maps.** { *; }",
            gradleProperties: {
              MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "a57a9873-7c6d-45b1-af9e-2ba19255cdb6",
        // projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      },
      androidClientIdDebug: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG,
      androidClientIdRelease: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID_RELEASE,
    },
  },
});
