import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {FontAwesome5, MaterialIcons} from 'react-native-vector-icons';
import styles from '../styles/CustomDrawerStyles';
import Theme from '../constants/theme';


const CustomDrawer = (props) => {
  const { onSignOut } = props;

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <View style={styles.userHeader}>
          <Image
            source={require('../../assets/images/user.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.header}>
             <View style={styles.userRoleContainer}>
            <Text style={styles.userRole}>Admin</Text>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          </View>
        </View>
        <View style={styles.drawerListContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}} style={styles.footerButton}>
          <View style={styles.footerButtonContent}>
            <MaterialIcons name='info' size={22} style={{color: Theme.colors.white}} />
            <Text style={styles.footerButtonText}>Help</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (onSignOut) {
              onSignOut(); 
            }
          }}
          style={styles.footerButton}
        >
          <View style={styles.footerButtonContent}>
            <Ionicons name='exit-outline' size={22} style={{color: Theme.colors.white}}/>
            <Text style={styles.footerButtonText}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;

