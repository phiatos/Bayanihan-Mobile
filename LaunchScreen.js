import React from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import angatbuhaylogo from '../Graphics/Images/angatbuhay_logo.png'

const LaunchScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={angatbuhaylogo} style={styles.logo} />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.buttonText}>Create an Account</Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText1}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7EC",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#14AFBC",
    paddingVertical: 20,
    width: 300,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: "#fff",
    fontWeight:'semibold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    color: "#FB3B9A",
    alignItems: "center",
  },
  loginText1: {
    color: "#FB3B9A",
  },
  loginText: {
    color: "#FB3B9A",
    fontWeight: "bold",
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
=======
import React from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import angatbuhaylogo from '../Graphics/Images/angatbuhay_logo.png'

const LaunchScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={angatbuhaylogo} style={styles.logo} />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.buttonText}>Create an Account</Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText1}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7EC",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#14AFBC",
    paddingVertical: 20,
    width: 300,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: "#fff",
    fontWeight:'semibold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    color: "#FB3B9A",
    alignItems: "center",
  },
  loginText1: {
    color: "#FB3B9A",
  },
  loginText: {
    color: "#FB3B9A",
    fontWeight: "bold",
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

