import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "react-native-vector-icons"; 


const RecoveryScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState(""); // Default to empty string instead of null
  const [recoveryMethod, setRecoveryMethod] = useState(""); // Track recovery method (Email/Mobile)
  const [email, setEmail] = useState("");
  const [mobileRecoveryStage, setMobileRecoveryStage] = useState(1);
  const [passwordRecoveryStage, setPasswordRecoveryStage] = useState(1);
  const [passwordRecoveryMethod, setPasswordRecoveryMethod] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+63");


  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setRecoveryMethod(""); 
  };

  const handleSubmit = () => {
    if (!recoveryMethod) {
      Alert.alert("Error", "Please select a recovery method.");
    } else {
      Alert.alert("Success", `Recovery process started for ${selectedOption} via ${recoveryMethod}`);
    }
  };


  return (
<View style={styles.container}>
  <View style={styles.header}>
  <TouchableOpacity
  style={styles.backButton}
  onPress={() => {
    if (selectedOption) {
      // Go back to option selection
      setSelectedOption("");
      setMobileRecoveryStage(1);
      setPasswordRecoveryStage(1);
      setPasswordRecoveryMethod("");
      setEmail("");
      setMobileNumber("");
      setCountryCode("+63");
    } else {
      navigation.goBack(); // Return to previous screen
    }
  }}
>
  <Ionicons name="arrow-back" size={28} color="#14AFBC" />
</TouchableOpacity>
    <Text style={styles.title}>Recover Access</Text>
  </View>

  {!selectedOption && (
  <>
    <Text style={styles.titleSecondary}>How can we help?</Text>
    <Text style={styles.descSecondary}>
      Select from the following options below if you are having trouble accessing your account.
    </Text>

    <TouchableOpacity style={styles.button} onPress={() => handleOptionSelect("mobile")}>
      <Text style={[styles.buttonText, selectedOption === "mobile" && styles.selectedOption]}>
        I forgot my mobile number
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.button} onPress={() => handleOptionSelect("password")}>
      <Text style={[styles.buttonText, selectedOption === "password" && styles.selectedOption]}>
        I forgot my password
      </Text>
    </TouchableOpacity>
  </>
)}

  {/* Forgot Mobile Number Flow */}
  {selectedOption === "mobile" && (
    <View style={styles.optionContent}>
      {mobileRecoveryStage === 1 ? (
        <>
          <Text style={styles.titleSecondary}>Enter your email address</Text>
          <Text style={styles.descSecondary}>
            Please enter your registered email address to recover your password.
          </Text>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!email) {
                Alert.alert("Error", "Please enter your email address.");
              } else {
                setMobileRecoveryStage(2);
              }
            }}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="checkmark-circle" size={150} color="#14AFBC" style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.description}>
            Your mobile number was sent to your registered email.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setSelectedOption("");
              setMobileRecoveryStage(1);
              setEmail("");
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )}

  {/* Forgot Password Flow */}
  {selectedOption === "password" && (
    <View style={styles.optionContent}>
      {!passwordRecoveryMethod ? (
        <>
          <Text style={styles.titleSecondary}>Forgot Password</Text>
          <Text style={styles.descSecondary}>
          To make sure it’s really you, we’ll be authenticating your request.

          Please select where you like to receive it.          
         </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setPasswordRecoveryMethod("email")}
          >
            <Text style={styles.buttonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setPasswordRecoveryMethod("mobile")}
          >
            <Text style={styles.buttonText}>Mobile Number</Text>
          </TouchableOpacity>
        </>
      ) : passwordRecoveryMethod === "email" ? (
        passwordRecoveryStage === 1 ? (
          <>
            <Text style={styles.titleSecondary}>Enter your email address</Text>
            <Text style={styles.descSecondary}>
              Please enter your registered email address to recover your password.
            </Text>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (!email) {
                  Alert.alert("Error", "Please enter your email address.");
                } else {
                  setPasswordRecoveryStage(2);
                }
              }}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
          <Ionicons name="checkmark-circle" size={150} color="#14AFBC" style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Success!</Text>
            <Text style={styles.description}>
              Your password was sent to your registered email.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setSelectedOption("");
                setPasswordRecoveryStage(1);
                setPasswordRecoveryMethod("");
                setEmail("");
              }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        )
      ) : passwordRecoveryStage === 1 ? (
        <>
          <Text style={styles.titleSecondary}>Enter your mobile number</Text>
          <Text style={styles.descSecondary}>
            Please enter your registered mobile number to recover your password.
          </Text>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <Picker
            selectedValue={countryCode}
            style={[styles.input, styles.countryCodePicker]}
            onValueChange={setCountryCode}
            >
            <Picker.Item label="63+" value="63" />
            <Picker.Item label="1+" value="1" />
            <Picker.Item label="44+" value="44" />
            </Picker>
            <TextInput
              style={[styles.input, styles.mobileInput]}
              placeholder="Enter mobile number"
              placeholderTextColor="#999"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!mobileNumber) {
                Alert.alert("Error", "Please enter your mobile number.");
              } else {
                setPasswordRecoveryStage(2);
              }
            }}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="checkmark-circle" size={150} color="#14AFBC" style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.description}>
            Your password was sent to your registered mobile number.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setSelectedOption("");
              setPasswordRecoveryStage(1);
              setPasswordRecoveryMethod("");
              setMobileNumber("");
              setCountryCode("+63");
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )}
</View>
)};

export default RecoveryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#FFF7EC",
    padding: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 60,
    width: "100%",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 5,
    zIndex: 1,
    padding: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#14AFBC",
    textAlign: "center",
    width: "100%",
  },
  titleSecondary: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#333",
  },
  descSecondary: {
    fontSize: 16,
    color: "#444",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
    width: "90%",
  },
  optionText: {
    fontSize: 16,
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
    
  },
  selectedOption: {
    fontWeight: "bold",
    color: "#FB3B9A", // Change color for selected option
  },
  optionContent: {
    width: "100%",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: "#444",
    marginTop: 20,
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 2.5,
    borderRadius: 10,
    paddingLeft: 10,
    fontSize: 15,
    color: "#444",
    backgroundColor: "#fff",
    width: "100%",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#14AFBC",
    paddingVertical: 15,
    width: '100%',
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  countryCodePicker: {
    width: 80,
    height: 50,
    fontSize: 18,
  },
  mobileInput: {
    width: 285,
    height: 50,
    marginLeft: 5,
    fontSize: 18,
  },
  
});
