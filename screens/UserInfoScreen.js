import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UserInfoScreen({ onContinue }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profilePersonalUid, setProfilePersonalUid] = useState(null);

  useEffect(() => {
    // Load saved first and last name if they exist
    const loadSavedData = async () => {
      try {
        const savedFirstName = await AsyncStorage.getItem("user_first_name");
        const savedLastName = await AsyncStorage.getItem("user_last_name");
        const userUid = await AsyncStorage.getItem("user_uid");

        console.log("Loading saved data:", {
          savedFirstName,
          savedLastName,
          userUid,
        });

        if (savedFirstName) setFirstName(savedFirstName);
        if (savedLastName) setLastName(savedLastName);

        // Check if profile exists
        if (userUid) {
          console.log("Checking for existing profile with userUid:", userUid);
          const response = await fetch(`https://ioec2testsspm.infiniteoptions.com/api/v1/userprofileinfo/${userUid}`);
          const data = await response.json();
          console.log("Profile check response:", JSON.stringify(data, null, 2));

          if (data.message !== "Profile not found for this user") {
            console.log("Profile exists, setting profile data");
            setProfileExists(true);
            setProfilePersonalUid(data.personal_info?.profile_personal_uid);
            console.log("Profile personal UID:", data.personal_info?.profile_personal_uid);

            // Pre-fill the form with existing data
            if (data.personal_info) {
              console.log("Pre-filling form with existing data:", data.personal_info);
              setFirstName(data.personal_info.profile_personal_first_name || "");
              setLastName(data.personal_info.profile_personal_last_name || "");
              setPhoneNumber(data.personal_info.profile_personal_phone_number || "");
            }
          } else {
            console.log("No existing profile found for user");
          }
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  const handleContinue = async () => {
    console.log("UserInfoScreen - Continue button pressed");
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      // Save the updated information to AsyncStorage
      await AsyncStorage.setItem("user_first_name", firstName.trim());
      await AsyncStorage.setItem("user_last_name", lastName.trim());
      await AsyncStorage.setItem("user_phone_number", phoneNumber.trim());

      // Get the user_uid from AsyncStorage
      const userUid = await AsyncStorage.getItem("user_uid");
      if (!userUid) {
        throw new Error("User UID not found");
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append("profile_personal_first_name", firstName.trim());
      formData.append("profile_personal_last_name", lastName.trim());
      formData.append("profile_personal_phone_number", phoneNumber.trim());
      formData.append("profile_personal_referred_by", "100-000001");
      formData.append("user_uid", userUid);

      // Add profile_uid to form data only for PUT requests
      if (profileExists && profilePersonalUid) {
        formData.append("profile_uid", profilePersonalUid);
      }

      // Log the form data contents
      console.log("Form data contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const endpoint = "https://ioec2testsspm.infiniteoptions.com/api/v1/userprofileinfo";
      const method = profileExists ? "PUT" : "POST";

      console.log("Making API request:", {
        endpoint,
        method,
        profileExists,
        profilePersonalUid,
      });

      // Make the appropriate request based on whether profile exists
      console.log("Sending this data:", formData);
      const response = await fetch(endpoint, {
        method,
        headers: {
          // Remove "Content-Type": "multipart/form-data"
        },
        body: formData,
      });

      console.log("API Response status:", response.status);
      console.log("API Response headers:", JSON.stringify(response.headers, null, 2));

      const responseObject = await response.json();
      console.log("API Response body:", JSON.stringify(responseObject, null, 2));

      if (!response.ok) {
        throw new Error(`Failed to ${method.toLowerCase()} user profile: ${responseObject.message || "Unknown error"}`);
      }

      console.log("Profile update successful, proceeding to next screen");
      onContinue();
    } catch (error) {
      console.error("Error updating user profile:", error);
      Alert.alert("Error", `Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Please provide your information to continue</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder='Enter your first name' autoCapitalize='words' />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder='Enter your last name' autoCapitalize='words' />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder='Enter your phone number' keyboardType='phone-pad' />
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleContinue} disabled={loading}>
        {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
