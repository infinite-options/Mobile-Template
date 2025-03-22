import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform, Alert } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";
import Constants from "expo-constants";
import AppleSignIn from "./AppleSignIn";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOOGLE_SIGNUP_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/UserSocialSignUp/EVERY-CIRCLE";

console.log("App.js - Imported config:", config);

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Configuring Google Sign-In...");
        console.log("Environment:", __DEV__ ? "Development" : "Production");

        console.log("Using client IDs:", {
          ios: config.googleClientIds.ios,
          android: config.googleClientIds.android,
          web: config.googleClientIds.web,
        });

        console.log("Using URL scheme:", config.googleURLScheme);

        const googleConfig = {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          offlineAccess: true,
        };
        console.log("Google Sign-In configuration:", googleConfig);

        await GoogleSignin.configure(googleConfig);
        console.log("Google Sign-In configured successfully");

        // Sign out any existing user on app start
        await GoogleSignin.signOut();
        setUserInfo(null);
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        setError(error.message);
      }
    };

    initialize();
  }, []);

  const handleSignIn = (userInfo) => {
    setUserInfo(userInfo);
    setError(null);
  };

  const handleSignUp = async (userInfo) => {
    try {
      const { idToken, user } = userInfo;
      console.log("User email:", user.email);
      console.log("User ID:", user.id);

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log("Retrieved tokens:", tokens);

      // Create user data payload
      const userData = {
        email: user.email,
        password: "GOOGLE_LOGIN",
        phone_number: "",
        google_auth_token: tokens.accessToken,
        google_refresh_token: tokens.refreshToken || "",
        social_id: user.id,
        first_name: user.givenName || "",
        last_name: user.familyName || "",
        profile_picture: user.photo || "",
      };

      console.log("Sending data to backend:", userData);

      // Call backend endpoint for Google signup
      const response = await fetch(GOOGLE_SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("Backend response:", result);

      // Handle response
      if (result.message === "User already exists") {
        Alert.alert("User Already Exists", "This Google account is already registered. Would you like to log in instead?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log In",
            onPress: () => signIn(),
          },
        ]);
        return;
      }

      // Store user data in AsyncStorage
      if (result.user_uid) {
        await AsyncStorage.setItem("user_uid", result.user_uid);
        await AsyncStorage.setItem("user_email_id", user.email);

        if (user.givenName || user.familyName) {
          await AsyncStorage.setItem("user_first_name", user.givenName || "");
          await AsyncStorage.setItem("user_last_name", user.familyName || "");
        }

        // Set user info and navigate to MapScreen
        setUserInfo(userInfo);
        setError(null);
      } else {
        Alert.alert("Error", "Failed to create account. Please try again.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert("Error", "Failed to complete sign up. Please try again.", [{ text: "OK" }]);
      setError(error.message);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const signIn = async () => {
    try {
      console.log("Starting Google Sign-In process...");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Sign-in successful:", userInfo);
      handleSignIn(userInfo);
    } catch (error) {
      console.error("Sign-in error:", error);
      handleError(error.message);
    }
  };

  const signUp = async () => {
    try {
      console.log("Starting Google Sign-Up process...");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Sign-up successful:", userInfo);
      handleSignUp(userInfo);
    } catch (error) {
      console.error("Sign-up error:", error);
      handleError(error.message);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      await GoogleSignin.signOut();
      console.log("Sign-out successful");
      setUserInfo(null);
      setError(null);
    } catch (error) {
      console.error("Sign-out error:", error);
      setError(error.message);
    }
  };

  return (
    <View style={styles.container}>
      {!userInfo ? (
        <>
          <Text style={styles.title}>Sign In</Text>
          {error && <Text style={styles.error}>Error: {error}</Text>}
          <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={signIn} />
          <AppleSignIn onSignIn={handleSignIn} onError={handleError} />
          <Text style={styles.title}>Sign Up</Text>
          {error && <Text style={styles.error}>Error: {error}</Text>}
          <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={signUp} />
          <AppleSignIn onSignIn={handleSignIn} onError={handleError} />
        </>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Text>Welcome {userInfo.user.name}</Text>
          </View>
          <MapScreen onLogout={signOut} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  googleButton: {
    width: 192,
    height: 48,
    marginTop: 20,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
});
