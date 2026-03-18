import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const dummyBookings = [
  { id: '1', service: 'AC Repair', date: '20 Mar 2026', status: 'Completed' },
  { id: '2', service: 'Plumbing', date: '22 Mar 2026', status: 'Pending' },
];

const Bookings = () => {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.service}>{item.service}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings 📋</Text>

      <FlatList
        data={dummyBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default Bookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  service: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});