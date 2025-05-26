import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const BursarHome = () => {
  const navigation = useNavigation();
  const [todayPayments, setTodayPayments] = useState([]); // Sample data
  const [pendingProduceValuations, setPendingProduceValuations] = useState([]); // Sample data

  useEffect(() => {
    // Replace with actual API calls to fetch data
    fetchTodayPayments();
    fetchPendingProduceValuations();
  }, []);

  const fetchTodayPayments = async () => {
    // Simulate API call
    setTodayPayments([
      { id: '1', studentName: 'Alice Smith', amountPaid: 5000, paymentMethod: 'MPESA' },
      { id: '2', studentName: 'Bob Johnson', amountPaid: '2 Bags Maize', paymentMethod: 'Produce' },
      // ... more payments
    ]);
  };

  const fetchPendingProduceValuations = async () => {
    // Simulate API call
    setPendingProduceValuations([
      { id: 'p1', parentName: 'Charlie Brown', produce: '3 Bags Beans' },
      { id: 'p2', parentName: 'Diana Miller', produce: '1 Truck Firewood' },
      // ... more pending valuations
    ]);
  };

  const navigateToProcessProduce = () => {
    navigation.navigate('ProcessProduce'); // Define this screen
  };

  const renderPaymentItem = ({ item }) => (
    <View style={styles.paymentItem}>
      <Text style={styles.paymentStudent}>{item.studentName}</Text>
      <Text style={styles.paymentAmount}>{item.amountPaid}</Text>
      <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
    </View>
  );

  const renderPendingValuationItem = ({ item }) => (
    <View style={styles.pendingItem}>
      <Text style={styles.pendingParent}>{item.parentName}</Text>
      <Text style={styles.pendingProduce}>{item.produce}</Text>
      <TouchableOpacity style={styles.valuationButton} onPress={navigateToProcessProduce}>
        <Text style={styles.valuationButtonText}>Value</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bursar Dashboard</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="plus-circle" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Record Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToProcessProduce}>
          <Icon name="leaf" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Process Produce</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="file-text" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Generate Receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Payments</Text>
        {todayPayments.length > 0 ? (
          <FlatList
            data={todayPayments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text>No payments recorded today.</Text>
        )}
      </View>

      {/* Pending Produce Valuations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Produce Valuations</Text>
        {pendingProduceValuations.length > 0 ? (
          <FlatList
            data={pendingProduceValuations}
            renderItem={renderPendingValuationItem}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text>No produce awaiting valuation.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 16,
    color: '#777',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentStudent: {
    flex: 2,
    fontWeight: 'bold',
    color: '#555',
  },
  paymentAmount: {
    flex: 1,
    textAlign: 'right',
    color: 'green',
  },
  paymentMethod: {
    flex: 1,
    textAlign: 'right',
    color: '#777',
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pendingParent: {
    flex: 2,
    fontWeight: 'bold',
    color: '#555',
  },
  pendingProduce: {
    flex: 2,
    color: '#777',
  },
  valuationButton: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  valuationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BursarHome;
