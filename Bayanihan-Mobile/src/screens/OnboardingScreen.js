import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';

const OnboardingScreen = ({navigation}) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'Poppins-MediumItalic': require('../../assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins/Poppins-Medium.ttf'),
      });
      setFontsLoaded(true);
    })();
  }, []);

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF9F0',
      }}
    >
      <View style={{marginTop: 20}}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#14AEBB',
            fontFamily: 'Poppins-Bold',
            textAlign: 'center',
          }}
        >
          Disaster Relief and Rehabilitation Management Portal
        </Text>
      </View>
      <View 
        style={{
          flex:1, 
          justifyContent:'center', 
          alignItems: 'center'}}>
        <Image 
          source={require('../../assets/images/ab_logo.png')}
          style={{
            width: 150, 
            height: 150, 
            marginVertical: 20, 
            resizeMode: 'contain',
          }} 
        />
      </View>
      
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={{
          backgroundColor: '#14AEBB',
          padding: 20,
          width: '90%',
          borderRadius: 5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 50
        }}
      >
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 18,
            color: '#FFF9F0',
            fontFamily: 'Poppins-MediumItalic', // this now works
          }}
        >
          Let's Begin
        </Text>
        <MaterialIcons name="arrow-forward-ios" size={22} color="#FFF9F0" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default OnboardingScreen;
