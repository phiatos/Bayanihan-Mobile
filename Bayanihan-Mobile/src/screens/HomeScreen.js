import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { View, Text, SafeAreaView, ScrollView, ImageBackground,TextInput} from "react-native";
import Feather from 'react-native-vector-icons/Feather';

const HomeScreen = ({navigation}) => {
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
        return null; // Or show a loading spinner
    }
    
    return (
        <SafeAreaView style={{flex:1, backgroundColor: "#FFF9F0"}}>
            <ScrollView style={{padding: 20}}>
                <View 
                    style={{
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        marginBottom: 20 
                    }}>
                    <Text style={{fontSize:16, fontFamily:'Poppins-Medium'}}>Hello John Doe</Text>
                    <ImageBackground
                        source={require('../../assets/images/user.jpg')} style={{width:35, height:35}}
                        imageStyle={{borderRadius:25}}>    
                    </ImageBackground>
                </View>

                <View 
                    style={{
                        flexDirection:'row', 
                        borderColor:'#c6c6c6', 
                        borderWidth: 1, 
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8, 
                    }}>
                    <Feather name="search" size={20} color="#c6c6c6" style={{marginRight: 5}}/>
                    <TextInput placeholder="Search"/>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;