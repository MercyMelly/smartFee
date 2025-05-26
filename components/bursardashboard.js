import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const BursarDashboard = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bursar Dashboard</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RecordPayment')}>
        <Text style={styles.cardTitle}>Record Produce Payment</Text>
        <Text style={styles.cardText}>Log goods brought by parents.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ViewReceipts')}>
        <Text style={styles.cardTitle}>View Receipts</Text>
        <Text style={styles.cardText}>Check past transaction receipts.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SendNotifications')}>
        <Text style={styles.cardTitle}>Send SMS Notifications</Text>
        <Text style={styles.cardText}>Notify parents about their balances.</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BursarDashboard;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#eef6f9',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#28a745',
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
});
