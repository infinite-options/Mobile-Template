import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import AppleSignIn from "../AppleSignIn";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const ACCOUNT_SALT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/EVERY-CIRCLE";
const LOGIN_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/Login/EVERY-CIRCLE";

export default function LoginScreen({ onGoogleSignIn, onAppleSignIn, onError, onSignUpPress, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const validateInputs = (email, password) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 6;
    setIsValid(isEmailValid && isPasswordValid);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    validateInputs(text, password);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validateInputs(email, text);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const createHash = async (value) => {
    // Convert the string to bytes using UTF-8 encoding (matching backend's str().encode())
    const encoder = new TextEncoder();
    const data = encoder.encode(value.toString());

    // Create hash from the encoded bytes
    const hashBuffer = await Crypto.digestAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const handleSubmitLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill out all the fields.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      setShowSpinner(true);

      // 1. Get the salt for this email
      console.log("Fetching salt for email:", email);
      const saltResponse = await fetch(ACCOUNT_SALT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const saltObject = await saltResponse.json();
      console.log("Salt response:", saltObject);

      if (saltObject.code !== 200) {
        Alert.alert("Error", "User does not exist. Please Sign Up.");
        return;
      }

      // 2. Get the salt and create the combined password+salt hash
      const salt = saltObject.result[0].password_salt;
      console.log("Retrieved salt:", salt);

      // First combine password and salt as strings
      const combinedString = password + salt;
      console.log("Combined string (password + salt):", combinedString);

      // Then create the hash of the combined string
      const hashedPassword = await createHash(combinedString);
      console.log("Final hashed password:", hashedPassword);

      // 3. Call the Login endpoint with the hashed password
      console.log("Attempting login with payload:", {
        email,
        password: hashedPassword,
      });

      const loginResponse = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: hashedPassword,
        }),
      });

      const loginData = await loginResponse.json();
      console.log("Login response:", loginData);

      // 4. If success, store the user data and proceed
      if (loginData.code === 200 && loginData.result && loginData.result[0]) {
        const userData = loginData.result[0];
        await AsyncStorage.setItem("user_uid", userData.user_uid);
        await AsyncStorage.setItem("user_email_id", email);

        Alert.alert("Success", "Login successful!", [
          {
            text: "OK",
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess();
              }
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Invalid credentials. Please check your email and password and try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Failed to login. Please try again.");
    } finally {
      setShowSpinner(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Please log in to continue.</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder='Email' value={email} onChangeText={handleEmailChange} keyboardType='email-address' autoCapitalize='none' />

        <TextInput style={styles.input} placeholder='Password' value={password} onChangeText={handlePasswordChange} secureTextEntry />
      </View>

      <TouchableOpacity style={[styles.continueButton, isValid && styles.continueButtonActive]} onPress={handleSubmitLogin} disabled={!isValid || showSpinner}>
        {showSpinner ? <ActivityIndicator color='#fff' /> : <Text style={[styles.continueButtonText, isValid && styles.continueButtonTextActive]}>Continue</Text>}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={onGoogleSignIn} />
        <AppleSignIn onSignIn={onAppleSignIn} onError={onError} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Text style={styles.signUpText} onPress={onSignUpPress}>
            Sign Up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007AFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: "#E5E5E5",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  continueButtonActive: {
    backgroundColor: "#FF9500",
  },
  continueButtonText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "bold",
  },
  continueButtonTextActive: {
    color: "#fff",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  googleButton: {
    width: 192,
    height: 48,
    marginBottom: 15,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#666",
  },
  signUpText: {
    color: "#FF9500",
    fontWeight: "bold",
  },
});
