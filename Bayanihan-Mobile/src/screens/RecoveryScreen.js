import { Picker } from "@react-native-picker/picker";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Firebase configuration (same as web)
const firebaseConfig = {
    apiKey: "AIzaSyDJxMv8GCaMvQT2QBW3CdzA3dV5X_T2KqQ",
    authDomain: "bayanihan-5ce7e.firebaseapp.com",
    databaseURL: "https://bayanihan-5ce7e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bayanihan-5ce7e",
    storageBucket: "bayanihan-5ce7e.appspot.com",
    messagingSenderId: "593123849917",
    appId: "1:593123849917:web:eb85a63a536eeff78ce9d4",
    measurementId: "G-ZTQ9VXXVV0"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

const RecoveryScreen = ({ navigation }) => {
    const [selectedOption, setSelectedOption] = useState("");
    const [recoveryMethod, setRecoveryMethod] = useState("");
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

    const handleEmailSubmit = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Alert.alert("Error", "Enter a valid email address.");
            return;
        }

        try {
            // Check if the email exists in the database
            let userFound = false;
            let userMobile = null;
            let userId = null;
            await database.ref('users').orderByChild('email').equalTo(email).once('value', snapshot => {
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        userFound = true;
                        userMobile = childSnapshot.val().mobile;
                        userId = childSnapshot.key;
                    });
                }
            });

            if (!userFound) {
                Alert.alert("Error", "No account is associated with this email address. Please try again or register.");
                return;
            }

            // Send password reset email
            const actionCodeSettings = {
                url: "https://bayanihan-5ce7e.firebaseapp.com/pages/login.html", // Adjust if you have a mobile-specific URL
                handleCodeInApp: false,
            };
            await auth.sendPasswordResetEmail(email, actionCodeSettings);

            // Store user details in AsyncStorage or similar for mobile
            // For simplicity, we'll just proceed to the next stage
            Alert.alert(
                "Success",
                `A password reset link has been sent to ${email}. Please check your email (including spam/junk folder).`,
                [{ text: "Got it!" }]
            );

            setPasswordRecoveryStage(2);
        } catch (error) {
            console.error('Error in email recovery:', error);
            let errorMessage = "Failed to send reset email. Please try again.";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account is associated with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address format.";
            }
            Alert.alert("Error", errorMessage);
        }
    };

    const handleMobileSubmit = async () => {
        if (!mobileNumber) {
            Alert.alert("Error", "Please enter your mobile number.");
            return;
        }

        const fullMobileNumber = `${countryCode}${mobileNumber}`.replace(/^\+/, '');

        try {
            // Check if the mobile number exists in the database
            let userFound = false;
            let userEmail = null;
            let userId = null;
            await database.ref('users').orderByChild('mobile').equalTo(fullMobileNumber).once('value', snapshot => {
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        userFound = true;
                        userEmail = childSnapshot.val().email;
                        userId = childSnapshot.key;
                    });
                }
            });

            if (!userFound) {
                Alert.alert("Error", "No account is associated with this mobile number. Please try again or register.");
                return;
            }

            // Since Firebase doesn't support password reset via SMS directly, we can send a reset email instead
            // Alternatively, integrate with an SMS service like Twilio (not implemented here)
            if (userEmail) {
                const actionCodeSettings = {
                    url: "https://bayanihan-5ce7e.firebaseapp.com/pages/login.html",
                    handleCodeInApp: false,
                };
                await auth.sendPasswordResetEmail(userEmail, actionCodeSettings);

                Alert.alert(
                    "Success",
                    `Since SMS reset is not supported, a password reset link has been sent to your registered email: ${userEmail}. Please check your email (including spam/junk folder).`,
                    [{ text: "Got it!" }]
                );
            } else {
                Alert.alert("Error", "No email associated with this mobile number. Please use email recovery.");
                return;
            }

            setPasswordRecoveryStage(2);
        } catch (error) {
            console.error('Error in mobile recovery:', error);
            Alert.alert("Error", "Failed to process mobile recovery. Please try again.");
        }
    };

    const handleMobileRecoverySubmit = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Alert.alert("Error", "Enter a valid email address.");
            return;
        }

        try {
            // Check if the email exists and retrieve the mobile number
            let userFound = false;
            let userMobile = null;
            await database.ref('users').orderByChild('email').equalTo(email).once('value', snapshot => {
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        userFound = true;
                        userMobile = childSnapshot.val().mobile;
                    });
                }
            });

            if (!userFound) {
                Alert.alert("Error", "No account is associated with this email address. Please try again or register.");
                return;
            }

            if (!userMobile) {
                Alert.alert("Error", "No mobile number associated with this email. Please contact support.");
                return;
            }

            // Simulate sending the mobile number to the email
            // In a real app, integrate with an email service to send the mobile number
            Alert.alert(
                "Success",
                `Your mobile number (${userMobile}) has been sent to your registered email: ${email}.`,
                [{ text: "Got it!" }]
            );

            setMobileRecoveryStage(2);
        } catch (error) {
            console.error('Error in mobile number recovery:', error);
            Alert.alert("Error", "Failed to process mobile number recovery. Please try again.");
        }
    };

    return (
<SafeAreaView style={styles.container}>
    
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
                setPasswordRecoveryStage(1);
                setEmail("");
                navigation.goBack();
            }}
        >
            <Ionicons name="arrow-back" size={28} color="#14AFBC" />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
    

    <View style={styles.optionContent}>
        {passwordRecoveryStage === 1 ? (
            <>
                {/* <Text style={styles.titleSecondary}>Enter your email address</Text> */}
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
                    onPress={handleEmailSubmit}
                >
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </>
        ) : (
            <>
                <Ionicons name="checkmark-circle" size={130} color="#14AFBC" style={{ marginTop: 20 }} />
                <Text style={styles.title}>Success!</Text>
                <Text style={styles.description}>
                    A password reset link was sent to your registered email.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        setPasswordRecoveryStage(1);
                        setEmail("");
                        navigation.goBack();
                    }}
                >
                    <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
            </>
        )}
    </View>
</SafeAreaView>
    );
};

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
        position: 'absolute',
        zIndex: 1,
        left: 10,
        top: 25,
        padding: 10,
        paddingTop: 25,
    },
    title: {
        fontSize: 26,
        color: '#14AFBC',
        textAlign: 'center',
        width: '100%',
        paddingTop: 20,
        fontFamily: 'Poppins_Medium',
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
        fontFamily: 'Poppins_Regular'
    },
    optionContent: {
        width: "100%",
        alignItems: "center",
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        color: "#444",
        marginTop: 20,
        marginBottom: 20,
        fontFamily: 'Poppins_Regular'
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
        fontFamily: 'Poppins_Regular'

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
        fontFamily: 'Poppins_SemiBold',
        fontSize: 16,
    },
    label: {
        alignSelf: "flex-start",
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
        fontFamily: 'Poppins_Bold'

    },

});