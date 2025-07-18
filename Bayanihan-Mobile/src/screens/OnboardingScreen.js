import React, { useEffect } from 'react'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { View, Text, TouchableOpacity, SafeAreaView, Animated, Image } from 'react-native';
import Theme from '../constants/theme';

const OnboardingScreen = ({ navigation }) => {
  const imageScale = new Animated.Value(0.1); 

  // Start animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(imageScale, {
        toValue: 1, // from 0.1 to 1 (scale)
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); 

  const handleScreenPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.lightBg,
      }}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Animated.Image
          source={require('../../assets/images/ab_logo.png')}
          style={{
            width: 200,
            height: 200,
            resizeMode: 'contain',
            transform: [{ scale: imageScale }],
          }}
        />
        <Text
          style={{
            fontSize: 18,
            color: '#14AEBB',
            textAlign: 'center',
            fontFamily: 'Poppins_Medium',
            marginTop: 20, 
          }}
        >
          Disaster Relief and Rehabilitation Management Portal
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleScreenPress}
        style={{
          backgroundColor: '#14AEBB',
          paddingVertical: 10,
          width: '60%',
          borderRadius: 15,
          flexDirection: 'row',
          justifyContent: 'center', 
          marginTop: 50,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: '#FFF9F0',
            textAlign: 'center',
            fontFamily: 'Poppins_Regular',
          }}
        >
          Let's Begin
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default OnboardingScreen;