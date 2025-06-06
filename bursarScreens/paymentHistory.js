import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('http://192.168.0.27:3000/api/payments/all');
        const data = await response.json();
        setPayments(data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>Student ID: {item.studentId}</Text>
      <Text>Method: {item.paymentMethod}</Text>
      {item.paymentMethod === 'produce' && (
        <>
          <Text>Produce: {item.produceType}</Text>
          <Text>Qty: {item.quantity}</Text>
          <Text>Unit: {item.unitValue}</Text>
        </>
      )}
      <Text>Amount: KES {item.amount}</Text>
      {item.referenceNumber && <Text>Ref: {item.referenceNumber}</Text>}
      {item.bankName && <Text>Bank: {item.bankName}</Text>}
      <Text style={styles.date}>Date: {new Date(item.date).toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2e7d32',
  },
  date: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#555',
  },
});

export default PaymentHistory;
