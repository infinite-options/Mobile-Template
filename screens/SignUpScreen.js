import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import AppleSignIn from "../AppleSignIn";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import CryptoJS from "react-native-crypto-js";
// import * as CryptoJS from "react-native-crypto-js";
import * as Crypto from "expo-crypto";

const ACCOUNT_SALT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/AccountSalt/EVERY-CIRCLE";
const CREATE_ACCOUNT_ENDPOINT = "https://mrle52rri4.execute-api.us-west-1.amazonaws.com/dev/api/v2/CreateAccount/EVERY-CIRCLE";

export default function SignUpScreen({ onGoogleSignUp, onAppleSignUp, onError, onLoginPress, onSignUpSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValid, setIsValid] = useState(false);

  const validateInputs = (email, password, confirmPassword) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 6;
    const doPasswordsMatch = password === confirmPassword;

    setIsValid(isEmailValid && isPasswordValid && doPasswordsMatch);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    validateInputs(text, password, confirmPassword);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    validateInputs(email, text, confirmPassword);
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    validateInputs(email, password, text);
  };

  //   const encryptPassword = (password) => {
  //     console.log("Encrypting password:", password);
  //     return CryptoJS.SHA256(password).toString();
  //   };

  const encryptPassword = async (password) => {
    console.log("Encrypting password:", password);
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    return hash;
  };

  const handleContinue = async () => {
    try {
      // First, check if the email exists
      //   console.log("Checking if email exists:", email);
      //   const saltResponse = await fetch(ACCOUNT_SALT_ENDPOINT, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ email }),
      //   });

      //   const saltData = await saltResponse.json();
      //   console.log("Salt endpoint response:", saltData);

      //   if (saltData.code === 200) {
      //     // Email exists, show error
      //     Alert.alert("Account Exists", "An account with this email already exists. Would you like to log in?", [
      //       {
      //         text: "Cancel",
      //         style: "cancel",
      //       },
      //       {
      //         text: "Log In",
      //         onPress: onLoginPress,
      //       },
      //     ]);
      //     return;
      //   }

      //   // Email doesn't exist, proceed with account creation
      //   console.log("Creating new account for email:", email, password);
      //   const encryptedPassword = await encryptPassword(password);
      //   console.log("Password encrypted (SHA256): ", encryptedPassword);
      //   console.log(
      //     JSON.stringify({
      //       email: email,
      //       password: encryptedPassword,
      //     })
      //   );
      console.log(
        "---Here 1---",
        JSON.stringify({
          email,
          password: password,
        })
      );

      const createAccountResponse = await fetch(CREATE_ACCOUNT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: password,
        }),
      });
      console.log("---Here 2---");

      const createAccountData = await createAccountResponse.json();
      console.log("Create account response:", createAccountData);

      if (createAccountData.code === 281 && createAccountData.user_uid) {
        // Store user data
        await AsyncStorage.setItem("user_uid", createAccountData.user_uid);
        await AsyncStorage.setItem("user_email_id", email);

        // Create userInfo object similar to Google Sign Up
        const userInfo = {
          user: {
            email: email,
            name: email.split("@")[0], // Use email username as name
            id: createAccountData.user_uid,
          },
        };

        // Show success message
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Call onSignUpSuccess with userInfo to trigger navigation
              if (onSignUpSuccess) {
                onSignUpSuccess(userInfo);
              }
            },
          },
        ]);
      } else {
        throw new Error("Failed to create account");
      }
    } catch (error) {
      console.error("Error in account creation:", error);
      Alert.alert("Error", "Failed to create account. Please try again.", [{ text: "OK" }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Every Circle!</Text>
        <Text style={styles.subtitle}>Please choose a signup option to continue.</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder='Email' value={email} onChangeText={handleEmailChange} keyboardType='email-address' autoCapitalize='none' />

        <TextInput style={styles.input} placeholder='Password' value={password} onChangeText={handlePasswordChange} secureTextEntry />

        <TextInput style={styles.input} placeholder='Confirm Password' value={confirmPassword} onChangeText={handleConfirmPasswordChange} secureTextEntry />
      </View>

      <TouchableOpacity style={[styles.continueButton, isValid && styles.continueButtonActive]} onPress={handleContinue} disabled={!isValid}>
        <Text style={[styles.continueButtonText, isValid && styles.continueButtonTextActive]}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={onGoogleSignUp} />
        <AppleSignIn onSignIn={onAppleSignUp} onError={onError} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.logInText} onPress={onLoginPress}>
            Log In
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
  logInText: {
    color: "#FF9500",
    fontWeight: "bold",
  },
});
