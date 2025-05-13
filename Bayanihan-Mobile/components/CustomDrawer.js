import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import styles from '../src/styles/CustomDrawerStyles'; 


const CustomDrawer = props => {
  const { navigation } = props;
   
  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
        >
        <View style={styles.userHeader}>
          <Image
            source={require('../assets/images/user.jpg')}
            style={styles.profileImage}
          />
          <Text
            style={styles.userName}>
            John Doe
          </Text>
          <View style={styles.userRoleContainer}>
            <Text
              style={styles.userRole}>
              Admin
            </Text>
            {/* Test with another icon */}
            <FontAwesome5 name="user" size={14} color="#fff" />
          </View>
        </View>
        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}} style={styles.footerButton}>
          <View style={styles.footerButtonContent}>
            <Ionicons name="share-social-outline" size={22} />
            <Text
              style={styles.footerButtonText}>
              Tell a Friend
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footerButton}>
          <View style={styles.footerButtonContent}>
            <Ionicons name="exit-outline" size={22} />
            <Text
              style={styles.footerButtonText}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;
