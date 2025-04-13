
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "react-native-vector-icons"; // Ensure this is installed
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const LoginScreen = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation(); // Get the navigation prop using the hook

  // Handle login logic
  const handleLogin = () => {
    let isValid = true;

    // Reset errors
    setMobileError("");
    setPasswordError("");

    if (!mobileNumber) {
      setMobileError("Mobile Number is required");
      isValid = false;
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      setMobileError("Mobile Number Invalid");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password is Incorrect");
      isValid = false;
    }

    if (isValid) {
      setIsLoading(true);
      // Simulate login process (replace with actual logic)
      setTimeout(() => {
        console.log("Logged in with", mobileNumber, password);
        setIsLoading(false);
        // Proceed with navigation or authentication here
      }, 2000);
    } else {
      Alert.alert("Error", "Please fix the errors above.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Launch")}>
          <Ionicons name="arrow-back" size={28} color="#14AFBC" />
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back!</Text>
      </View>

      {/* Mobile Number Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Recover Access Button */}
        <TouchableOpacity style={styles.recoverButton} onPress={() => navigation.navigate("Recovery")}>
          <Text style={styles.recoverText}>Recover Access</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? "Loading..." : "Log in"}</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>By using Bayanihan, you agree to the Terms and Privacy Policy.</Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start", // Align elements at the top
    alignItems: "center",
    backgroundColor: "#FFF7EC",
    padding: 26,
  },
  header: {
    flexDirection: "row", // Align title and back button horizontally
    alignItems: "center",
    marginBottom: 60, // Reduce space between header and form
    width: "100%", // Take full width of the screen
    position: "relative", // Allow for absolute positioning of the back button
  },
  backButton: {
    position: "absolute",
    left: 5,
    zIndex: 1, // Ensure the button is on top
    padding: 10, // Add padding to increase touchable area
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#14AFBC",
    textAlign: "center", // Keep the title centered
    width: "100%", // Make sure title takes full width
  },
  inputContainer: {
    width: 300,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    alignSelf: "flex-start", // Align label to the left (start)
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 2.5,
    borderRadius: 10,
    paddingLeft: 10,
    fontSize: 15,
    color: '#444',
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#14AFBC",
    paddingVertical: 20,
    width: 300,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#A1D8D9", // Lighter shade when loading
  },
  buttonText: {
    textAlign: 'center', // Corrected textAlign for centering button text
    color: "#fff",
    fontWeight: 'semibold',
    fontSize: 16,
  },
  recoverButton: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "flex-end", // Align 'Recover Access' to the right
  },
  recoverText: {
    color: "#FB3B9A",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  termsText: {
    textAlign: 'center',
    width: 230,
    lineHeight: 22.4,
    marginTop: 320, // Add top margin to prevent overlap
    fontSize: 14,
    color: '#444',
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
});
=======
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "react-native-vector-icons"; // Ensure this is installed
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const LoginScreen = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation(); // Get the navigation prop using the hook

  // Handle login logic
  const handleLogin = () => {
    let isValid = true;

    // Reset errors
    setMobileError("");
    setPasswordError("");

    if (!mobileNumber) {
      setMobileError("Mobile Number is required");
      isValid = false;
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      setMobileError("Mobile Number Invalid");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password is Incorrect");
      isValid = false;
    }

    if (isValid) {
      setIsLoading(true);
      // Simulate login process (replace with actual logic)
      setTimeout(() => {
        console.log("Logged in with", mobileNumber, password);
        setIsLoading(false);
        // Proceed with navigation or authentication here
      }, 2000);
    } else {
      Alert.alert("Error", "Please fix the errors above.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Launch")}>
          <Ionicons name="arrow-back" size={28} color="#14AFBC" />
        </TouchableOpacity>

        <Text style={styles.title}>Welcome Back!</Text>
      </View>

      {/* Mobile Number Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Recover Access Button */}
        <TouchableOpacity style={styles.recoverButton} onPress={() => navigation.navigate("Recovery")}>
          <Text style={styles.recoverText}>Recover Access</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? "Loading..." : "Log in"}</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>By using Bayanihan, you agree to the Terms and Privacy Policy.</Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start", // Align elements at the top
    alignItems: "center",
    backgroundColor: "#FFF7EC",
    padding: 26,
  },
  header: {
    flexDirection: "row", // Align title and back button horizontally
    alignItems: "center",
    marginBottom: 60, // Reduce space between header and form
    width: "100%", // Take full width of the screen
    position: "relative", // Allow for absolute positioning of the back button
  },
  backButton: {
    position: "absolute",
    left: 5,
    zIndex: 1, // Ensure the button is on top
    padding: 10, // Add padding to increase touchable area
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#14AFBC",
    textAlign: "center", // Keep the title centered
    width: "100%", // Make sure title takes full width
  },
  inputContainer: {
    width: 300,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    alignSelf: "flex-start", // Align label to the left (start)
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 2.5,
    borderRadius: 10,
    paddingLeft: 10,
    fontSize: 15,
    color: '#444',
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#14AFBC",
    paddingVertical: 20,
    width: 300,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#A1D8D9", // Lighter shade when loading
  },
  buttonText: {
    textAlign: 'center', // Corrected textAlign for centering button text
    color: "#fff",
    fontWeight: 'semibold',
    fontSize: 16,
  },
  recoverButton: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "flex-end", // Align 'Recover Access' to the right
  },
  recoverText: {
    color: "#FB3B9A",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  termsText: {
    textAlign: 'center',
    width: 230,
    lineHeight: 22.4,
    marginTop: 320, // Add top margin to prevent overlap
    fontSize: 14,
    color: '#444',
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
});
