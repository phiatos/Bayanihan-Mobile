import React, { useEffect, useState } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, SafeAreaView, Image, Animated, TouchableWithoutFeedback } from 'react-native';
import Theme from '../constants/theme';

const OnboardingScreen = ({navigation}) => {
const imageScale = new Animated.Value(0.1); // For scaling the image

  Animated.parallel([
    Animated.timing(imageScale, {
      toValue: 1, // from 0.1 to 1 (scale)
      duration: 900,
      useNativeDriver: true,
  }),
  // Animated.timing(imagePosition, {
  // toValue: 0, // Move from -200 (offscreen top) to 0 (centered)
  // duration: 1500,
  // useNativeDriver: true,
  // }),
  ]).start();

    const handleScreenPress = () => {
    navigation.navigate('Login');
  };

  return (
    // <TouchableWithoutFeedback onPress={handleScreenPress}>
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.lightBg,
        
      }}
    >
    <View 
        style={{
          justifyContent:'center', 
          alignItems: 'center',
          }}>
        <Animated.Image 
          source={require('../../assets/images/ab_logo.png')}
          style={{
            width: 200,
            height: 200,
            resizeMode: 'contain',
            transform: [{scale:imageScale}],
          }} 
        />
      <View>
        <Text
          style={{
            fontSize: 18,
            color: '#14AEBB',
            textAlign: 'center',
            fontFamily: 'Poppins_Medium',
          }}
        >
          Disaster Relief and Rehabilitation Management Portal
        </Text>
      </View>
      </View>

      
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={{
          backgroundColor: '#14AEBB',
          paddingVertical: 10,
          width: '60%',
          borderRadius: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          textAlign: 'center',
          marginTop: 50,
          justifyContent: 'center'
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: '#FFF9F0',
            textAlign:'center',
            fontFamily: 'Poppins_Regular',
          }}
        >
          Let's Begin
        </Text>
        {/* <MaterialIcons name="arrow-forward-ios" size={22} color="#FFF9F0" /> */}
      </TouchableOpacity>
    </SafeAreaView>
    // </TouchableWithoutFeedback>
  );
}

export default OnboardingScreen;
