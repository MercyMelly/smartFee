import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://192.168.0.105:3000/api/dashboard/summary'); 
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.sectionTitle}>Welcome Admin</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" />
      ) : (
        <View style={styles.cardContainer}>
          <View style={[styles.card, { backgroundColor: '#4caf50' }]}>
            <Text style={styles.cardLabel}>Total Students</Text>
            <Text style={styles.cardValue}>{summary.totalStudents}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#2196f3' }]}>
            <Text style={styles.cardLabel}>Fees Collected</Text>
            <Text style={styles.cardValue}>KES {summary.totalCollected}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#f44336' }]}>
            <Text style={styles.cardLabel}>Outstanding Fees</Text>
            <Text style={styles.cardValue}>KES {summary.totalOutstanding}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#ff9800' }]}>
            <Text style={styles.cardLabel}>Payments Today</Text>
            <Text style={styles.cardValue}>{summary.paymentsToday}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#9c27b0' }]}>
            <Text style={styles.cardLabel}>Defaulters</Text>
            <Text style={styles.cardValue}>{summary.defaultersCount}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  sectionTitle: {
    fontSize: 18,
    color: 'gray',
  },
  cardContainer: {
    marginTop: 20,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  cardValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default AdminDashboard;
