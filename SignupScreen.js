import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ScrollView, Picker } from "react-native";
import { Ionicons } from "react-native-vector-icons"; // Ensure this is installed

const SignupScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("63");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // To manage the part of the form we're on
  const [timer, setTimer] = useState(180);
  const [resendDisabled, setResendDisabled] = useState(true);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "",
    houseNo: "",
    streetName: "",
    barangay: "",
    city: "",
    province: "",
    country: "",
    postalCode: "",
    mobileNumber: "",
    otp: "",
  });



  useEffect(() => {
    let interval;
    if (step === 4 && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
    }
  
    return () => clearInterval(interval);
  }, [step, timer]);
  

  // Logic for going back to the previous step
  const handleReturn = () => {
    if (step > 1) {
      setStep(step - 1); // Go back to the previous part of the form
    } else {
        navigation.navigate("Launch")
    }
  };

  const handleNext = () => {
    // Call validation before proceeding to next step
    if (!validateStep()) {
      return; // If validation fails, return early
    }
  
    if (step === 1) {
      setStep(2); // Proceed to Part 2
    } else if (step === 2) {
      setStep(3); // Proceed to Part 3
    } else if (step === 3) {
      setStep(4); // Proceed to Part 4
    } else if (step === 4) {
      // OTP verification logic here
      Alert.alert("Success", "Account created successfully.");
    }
  };
  
  // Validation logic for each step
  const validateStep = () => {
    let newErrors = {};
    let isValid = true;
  
    // Part 1 validation
    if (step === 1) {
      if (!firstName) {
        newErrors.firstName = "First name is required.";
        isValid = false;
      }
      if (!lastName) {
        newErrors.lastName = "Last name is required.";
        isValid = false;
      }
      if (!email) {
        newErrors.email = "Email is required.";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Invalid email format.";
        isValid = false;
      }
      if (!password) {
        newErrors.password = "Password is required.";
        isValid = false;
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required.";
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
        isValid = false;
      }
      if (!accountType) {
        newErrors.accountType = "Account type is required.";
        isValid = false;
      }
    }
  
    // Part 2 validation
    if (step === 2) {
      if (!houseNo) {
        newErrors.houseNo = "House number is required.";
        isValid = false;
      }
      if (!streetName) {
        newErrors.streetName = "Street name is required.";
        isValid = false;
      }
      if (!barangay) {
        newErrors.barangay = "Barangay is required.";
        isValid = false;
      }
      if (!city) {
        newErrors.city = "City is required.";
        isValid = false;
      }
      if (!province) {
        newErrors.province = "Province is required.";
        isValid = false;
      }
      if (!country) {
        newErrors.country = "Country is required.";
        isValid = false;
      }
      if (!postalCode) {
        newErrors.postalCode = "Postal code is required.";
        isValid = false;
      }
    }
  
    // Part 3 validation
    if (step === 3) {
      if (!mobileNumber) {
        newErrors.mobileNumber = "Mobile number is required.";
        isValid = false;
      }
    }
  
    // Part 4 validation
    if (step === 4) {
      if (!otp) {
        newErrors.otp = "OTP is required.";
        isValid = false;
      }
    }
  
    setErrors(newErrors); // Set the errors for UI feedback
    return isValid;
  };
  

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Return Button - Visible only if not on the first step */}
      {step >= 1 && (
        <TouchableOpacity style={styles.returnButton} onPress={handleReturn}>
          <Ionicons name="arrow-back" size={28} color="#14AFBC" />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Create New Account</Text>
      <Text style={styles.desc}>Fill up the required information below</Text>

      {/* Part 1 */}
      {step === 1 && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>First Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

          <Text style={styles.label}>Last Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

          <Text style={styles.label}>Email Address:</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Password:</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <Text style={styles.label}>Confirm Password:</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <Text style={styles.label}>Account Type:</Text>
          <Picker
            selectedValue={accountType}
            style={styles.input}
            onValueChange={setAccountType}
          >
            <Picker.Item label="Select Account Type" value="" />
            <Picker.Item label="Angat Buhay Admins" value="admin" />
            <Picker.Item label="ABVN Convenors" value="convenor" />
            <Picker.Item label="Volunteers" value="volunteer" />
          </Picker>
          {errors.accountType && <Text style={styles.errorText}>{errors.accountType}</Text>}

          <Text style={styles.termsText}>By using Bayanihan, you agree to the Terms and Privacy Policy.</Text>

        </View>
        
      )}


      {/* Part 2 */}
      {step === 2 && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>House No.:</Text>
          <TextInput
            style={styles.input}
            placeholder="House No."
            value={houseNo}
            onChangeText={setHouseNo}
          />
          {errors.houseNo && <Text style={styles.errorText}>{errors.houseNo}</Text>}

          <Text style={styles.label}>Street Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="Street Name"
            value={streetName}
            onChangeText={setStreetName}
          />
          {errors.streetName && <Text style={styles.errorText}>{errors.streetName}</Text>}
         
          <Text style={styles.label}>Barangay:</Text>
          <TextInput
            style={styles.input}
            placeholder="Barangay"
            value={barangay}
            onChangeText={setBarangay}
          />
          {errors.barangay && <Text style={styles.errorText}>{errors.barangay}</Text>}

          {/* Dropdowns for city, province, country */}
          <Text style={styles.label}>City:</Text>
          <Picker selectedValue={city} style={styles.input} onValueChange={setCity}>
            <Picker.Item label="Select City" value="" />
            <Picker.Item label="City 1" value="city1" />
            <Picker.Item label="City 2" value="city2" />
          </Picker>

          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
  

          <Text style={styles.label}>Province:</Text>
          <Picker selectedValue={province} style={styles.input} onValueChange={setProvince}>
            <Picker.Item label="Select Province" value="" />
            <Picker.Item label="Province 1" value="province1" />
            <Picker.Item label="Province 2" value="province2" />
          </Picker>

          {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}


          <Text style={styles.label}>Country:</Text>
          <Picker selectedValue={country} style={styles.input} onValueChange={setCountry}>
            <Picker.Item label="Select Country" value="" />
            <Picker.Item label="Country 1" value="country1" />
            <Picker.Item label="Country 2" value="country2" />
          </Picker>

          {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}


          <Text style={styles.label}>Postal Code:</Text>
          <TextInput
            style={styles.input}
            placeholder="Postal Code"
            value={postalCode}
            onChangeText={setPostalCode}
          />

          {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}

        </View>
      )}

      {/* Part 3 */}
      {step === 3 && (
        <View style={styles.formContainer}>
          <Text style={styles.titleSecondary}>Enter your mobile number:</Text>
          <Text style={styles.descSecondary}>We have send you an One Time Password(OTP)
          on this mobile number:</Text>
          <Text style={styles.label}>Mobile Number:</Text>
          <View style={styles.rowContainer}>
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
              placeholder="Enter Mobile Number"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

          </View>
          {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
          <Text style={styles.termsTextSecondary}>By proceeding, you consent to receive calls or SMS messages, including those sent by automated means, from the App and its affiliates to the number provided. Your mobile number will also be used for logging into the Bayanihan App.</Text>

        </View>
      )}

    {step === 4 && (
    <View style={styles.formContainer}>
        <Text style={styles.titleSecondary}>OTP Verification:</Text>

        <Text style={styles.descSecondary}> Enter the 4-digit code sent to you at{' '}:</Text>
        <Text style={{ fontWeight: 'bold', textAlign:'center', fontSize: 16}}>
                {mobileNumber || '[your contact info here]'}
            </Text>

        <Text style={styles.timer}>
        {timer > 0 ? `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}` : 'You can now resend the code.'}
        </Text>

        <View style={styles.otpContainer}>
        <View style={styles.otpInputs}>
            {[0, 1, 2, 3].map((index) => (
            <TextInput
                key={index}
                style={styles.otpInput}
                maxLength={1}
                keyboardType="number-pad"
                value={otp[index] || ''}
                onChangeText={(text) => {
                const newOtp = otp.split('');
                newOtp[index] = text;
                setOtp(newOtp.join(''));
                }}
            />
            ))}
        </View>

        </View>
        {errors.otp && <Text style={[styles.errorText, { marginTop: 10}]}>{errors.otp}</Text>}


        <View style={styles.otpDescContainer}>
        <Text style={styles.otpDesc}>Didn’t receive the OTP?</Text>
        <TouchableOpacity
        onPress={() => {
            if (!resendDisabled) {
            // Trigger your resend function
            console.log('OTP Resent!');
            setTimer(180);
            setResendDisabled(true);
            }
        }}
        disabled={resendDisabled}
        >
        <Text style={[styles.resendText, { color: resendDisabled ? '#aaa' : '#007bff' }]}>
            Resend Code
        </Text>
        </TouchableOpacity>
        </View>
    </View>
    )}


      {/* Next Button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{step === 4 ? "Submit" : step === 3 ? "Get Code" : "Next"}</Text>
      </TouchableOpacity>
      

    </ScrollView>
    
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFF7EC",
      paddingHorizontal: 20,
    },
    scrollContent: {
      justifyContent: "flex-start",
      paddingVertical: 20,
    },
    returnButton: {
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
      width: "100%", // Make sure title takes full width
      marginTop:6,
      marginBottom: 8,
    },
    desc: {
      textAlign: "center",
      fontSize: 16,
      marginBottom: 20,
      color: "#777",
    },
    titleSecondary: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
        marginTop: 50,
        marginBottom: 10,
      },
      descSecondary: {
        textAlign: "center",
        fontSize: 16,
        marginBottom: 20,
        color: "#444",
      },
    formContainer: {
      width: "100%",
      marginBottom: 30,  // Slightly increased space between parts
    },
    label: {
      fontSize: 14,  // Increased font size for readability
      fontWeight: "bold",
      color: "#444",
      marginBottom: 10,  // Adjusted for consistency
    },
    input: {
      height: 50,
      borderColor: "#444",
      borderWidth: 2.5,
      borderRadius: 10,
      fontSize: 14,
      marginBottom: 25,
      padding:10,
      color: "#444",
      backgroundColor: "#fff",
    },
    button: {
      backgroundColor: "#14AFBC",
      paddingVertical: 20,
      width: "100%",
      borderRadius: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
      marginTop: -5,
    },
    buttonText: {
      textAlign: "center",
      color: "#fff",
      fontWeight: "semibold",
      fontSize: 18,
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
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
    termsText: {
      position: 'absolute',
      textAlign: 'center',
      bottom: -160,
      fontSize: 14,
      color: '#444',
    },
    termsTextSecondary: {
        position: 'absolute',
        textAlign: 'center',
        bottom: -255,
        fontSize: 14,
        color: '#444',
      },
    otpDescContainer:{
        alignSelf: 'center',
        position: 'absolute',
        textAlign: 'center',
        bottom: -155,
    },
    otpDesc:{
        textAlign: 'center',
    },
    resendText:{
        fontWeight:'bold',
        textAlign: 'center',
    },
    timer:{
        textAlign: 'center',
        marginTop: 80,
        fontSize: 20,
        fontWeight: "semibold",
    },
    labelOTP: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    otpContainer: {
        alignItems: 'center',
    },
    otpInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    otpInput: {
        width: 80,
        height: 60,
        margin: 5,
        borderWidth: 1.5,
        backgroundColor:'#fff',
        borderColor: '#000',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 20,
    },
    errorText: {
      color: "red",
      fontWeight: "500",
      fontSize: 14,
      marginTop: -18, // Adjust as needed for your layout
    },
    


  });
  
