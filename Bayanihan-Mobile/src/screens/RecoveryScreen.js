import { Picker } from "@react-native-picker/picker";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Theme from "../constants/theme";
import styles from "../styles/RecoveryScreenStyles";

const firebaseConfig = {
    apiKey: "AIzaSyBkmXOJvnlBtzkjNyR6wyd9BgGM0BhN0L8",
    authDomain: "bayanihan-new-472410.firebaseapp.com",
    projectId: "bayanihan-new-472410",
    storageBucket: "bayanihan-new-472410.firebasestorage.app",
    messagingSenderId: "995982574131",
    appId: "1:995982574131:web:3d45e358fad330c276d946",
    measurementId: "G-CEVPTQZM9C",
    databaseURL: "https://bayanihan-new-472410-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

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
          ToastAndroid.show('Please enter your email address.',ToastAndroid.SHORT);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
           ToastAndroid.show('Please enter a valid email address.',ToastAndroid.SHORT);
            return;
        }

        try {
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

            const actionCodeSettings = {
                url: "https://bayanihan-5ce7e.firebaseapp.com/pages/login.html", // Adjust if you have a mobile-specific URL
                handleCodeInApp: false,
            };
            await auth.sendPasswordResetEmail(email, actionCodeSettings);

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
                <Text style={styles.descSecondary}>
                    Please enter your registered email address to recover your password.
                </Text>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor={Theme.colors.placeholderColor}
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
    