import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Profile = () => {
  return (
    <View style={styles.container}>
      
      <View style={styles.profileBox}>
        <Text style={styles.name}>Kanishka 👤</Text>
        <Text style={styles.email}>kanishka@email.com</Text>
      </View>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>My Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Logout</Text>
      </TouchableOpacity>

    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  profileBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    fontSize: 16,
  },
});