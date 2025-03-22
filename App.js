import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform, Alert, ActivityIndicator } from "react-native";
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
  const [showSpinner, setShowSpinner] = useState(false);
  const [signInInProgress, setSignInInProgress] = useState(false);

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

  const handleAppleSignUp = async (userInfo) => {
    console.log("Apple sign-up called with userInfo:", JSON.stringify(userInfo, null, 2));

    // Set a timeout to reset the sign-in state in case the process hangs
    const signInTimeoutId = setTimeout(() => {
      console.log("Apple sign-up timeout - resetting state");
      setSignInInProgress(false);
      setShowSpinner(false);
    }, 30000); // 30 seconds timeout

    try {
      setShowSpinner(true);
      setSignInInProgress(true);

      // Extract user data from Apple Sign In response
      const { user, idToken } = userInfo;

      console.log("Apple User ID:", user.id);
      console.log("Apple User Email:", user.email);
      console.log("Apple User Name:", user.name);
      console.log("Apple ID Token Length:", idToken ? idToken.length : 0);

      // Extract email from idToken if user.email is null
      let userEmail = user.email;

      // If email is null, try to extract it from the idToken
      if (!userEmail && idToken) {
        try {
          const tokenParts = idToken.split(".");
          if (tokenParts.length >= 2) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.email) {
              userEmail = payload.email;
              console.log("Extracted email from idToken:", userEmail);
            }
          }
        } catch (e) {
          console.log("Error extracting email from idToken:", e);
        }
      }

      // If still no email, use a placeholder
      if (!userEmail) {
        userEmail = `apple_user_${user.id}@example.com`;
        console.log("Using placeholder email:", userEmail);
      }

      // Create user data payload for backend
      const userData = {
        email: userEmail,
        password: "APPLE_LOGIN",
        phone_number: "",
        google_auth_token: idToken,
        google_refresh_token: "apple",
        social_id: user.id,
        first_name: user.name ? user.name.split(" ")[0] : "",
        last_name: user.name ? user.name.split(" ").slice(1).join(" ") : "",
        profile_picture: "",
        login_type: "apple",
      };

      console.log("Sending Apple data to backend:", JSON.stringify(userData, null, 2));

      // Call backend endpoint for Apple signup
      const response = await fetch(GOOGLE_SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("Backend response for Apple Sign Up:", JSON.stringify(result, null, 2));

      // Handle response
      if (result.message === "User already exists") {
        const appleLoginEndpoint = "https://41c664jpz1.execute-api.us-west-1.amazonaws.com/dev/appleLogin";
        console.log("Calling appleLogin endpoint with ID:", user.id);

        const loginResponse = await fetch(appleLoginEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ id: user.id }),
        });

        const loginData = await loginResponse.json();
        console.log("Apple Login endpoint response:", loginData);

        if (loginData?.result?.[0]?.user_uid) {
          const userData = loginData.result[0];
          await AsyncStorage.setItem("user_uid", userData.user_uid);
          await AsyncStorage.setItem("user_email_id", userData.user_email_id || userEmail);
          setUserInfo(userInfo);
          setError(null);
        } else {
          Alert.alert("Error", "Failed to login with Apple. Please try again.");
        }
      } else if (result.user_uid) {
        console.log("Storing Apple user data in AsyncStorage - user_uid:", result.user_uid);
        await AsyncStorage.setItem("user_uid", result.user_uid);
        await AsyncStorage.setItem("user_email_id", userEmail);

        if (user.name) {
          const firstName = user.name.split(" ")[0] || "";
          const lastName = user.name.split(" ").slice(1).join(" ") || "";
          await AsyncStorage.setItem("user_first_name", firstName);
          await AsyncStorage.setItem("user_last_name", lastName);
        }

        setUserInfo(userInfo);
        setError(null);
      } else {
        Alert.alert("Error", "Failed to create account. Please try again.");
      }
    } catch (error) {
      console.error("Apple sign-up error:", error);
      Alert.alert("Error", "Failed to complete Apple sign up. Please try again.");
      setError(error.message);
    } finally {
      clearTimeout(signInTimeoutId);
      setShowSpinner(false);
      setSignInInProgress(false);
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
          <AppleSignIn onSignIn={handleAppleSignUp} onError={handleError} />
          {showSpinner && (
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size='large' color='#0000ff' />
            </View>
          )}
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
  spinnerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
