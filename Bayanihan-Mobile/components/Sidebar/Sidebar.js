// components/Sidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from './SidebarContext';


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
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subTitle}>Sophia Torrenueva</Text>
      </View>
      <View style={styles.content}>
      <TouchableOpacity onPress={() => navigateAndClose('Profile')} style={styles.link}>
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateAndClose('ReliefRequest')} style={styles.link}>
        <Text style={styles.linkText}>Relief Request</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateAndClose('ReportSubmission')} style={styles.link}>
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
    padding: 16,
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
    marginTop: 15,
    marginBottom: 30
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  subTitle:{
    fontSize: 17,
    color: '#4059A5',
    fontWeight:'bold',
    padding:0,
  },
  link: {
    paddingVertical: 12,
  },
  linkText:{
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500'
  },
});
