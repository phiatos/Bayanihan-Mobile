// components/Sidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from './SidebarContext';
import { MaterialIcons, FontAwesome5, FontAwesome, FontAwesome6 } from '@expo/vector-icons';


const Sidebar = () => {
  const navigation = useNavigation();
  const { closeSidebar } = useSidebar();

  const navigateAndClose = (screen) => {
    navigation.navigate(screen);
    closeSidebar();
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
      <FontAwesome5  name="user-circle" size={40} color="white" />
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subTitle}>Sophia Torrenueva</Text>
      </View>

      <View style={styles.divider}>
        <View style={{ height: 2, backgroundColor: 'white'}} />
      </View>

      <View style={styles.content}>
      <TouchableOpacity onPress={() => navigateAndClose('Profile')} style={styles.link}>
      <MaterialIcons name="dashboard" size={24} color="white" />
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateAndClose('ReliefRequest')} style={styles.link}>
      <FontAwesome  name="line-chart" size={24} color="white" />
        <Text style={styles.linkText}>Relief Request</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateAndClose('ReportSubmission')} style={styles.link}>
        <MaterialIcons name="assessment" size={26} color="white" />
        <Text style={styles.linkText}>Report Submission</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: '#14AEBB',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100, 
    elevation: 5,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,

  },
  header:{
    marginTop: 30,
    marginHorizontal: 15,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_Regular',
    paddingLeft: 10,
  },
  subTitle:{
    fontSize: 15,
    color: '#4059A5',
    padding:0,
    fontFamily: 'Poppins_Bold',
    position: 'absolute',
    top: 20,
    left: 47
  },
  divider:{
    margin:0, 
    borderWidth: 1, 
    padding: 10, 
    width: 230,
    borderColor: 'transparent'
  },
  content:{
    marginHorizontal: 15,
  },
  link: {
    display: 'flex',
    flexDirection: 'row', 
      paddingVertical: 12,
  },
  linkText:{
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_Regular',
    paddingLeft: 20,
    },
});
