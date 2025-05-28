import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';

const StudentDetails = ({ route }) => {
  const { student } = route.params;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/payments/${student._id}`);
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const renderPayment = ({ item }) => (
    <View style={styles.paymentItem}>
      <Text style={styles.paymentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      <Text>Method: {item.paymentMethod}</Text>
      <Text>
        Amount: {item.paymentMethod === 'produce' 
          ? `${item.quantity} x ${item.produceType}` 
          : `KES ${item.amount}`}
      </Text>
      {item.referenceNumber ? <Text>Ref: {item.referenceNumber}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{student.fullName}</Text>
      <Text style={styles.info}>Parent: {student.parentName}</Text>
      <Text style={styles.info}>Phone: {student.parentPhone}</Text>
      <Text style={styles.info}>Class: {student.className}</Text>
      <Text style={styles.info}>Total Fees: KES {student.totalFees}</Text>
      <Text style={styles.info}>Balance: KES {student.balance}</Text>

      <Text style={styles.sectionTitle}>Payment History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" />
      ) : payments.length === 0 ? (
        <Text>No payments recorded yet.</Text>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPayment}
          style={styles.paymentList}
        />
      )}
        <TouchableOpacity
            style={styles.payButton}
            onPress={() => navigation.navigate('makePayment', { student })}
        >
            <Text style={styles.payButtonText}>Make Payment</Text>
        </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
    color: '#444',
  },
  sectionTitle: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  paymentList: {
    flexGrow: 0,
  },
  paymentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  paymentDate: {
    fontWeight: 'bold',
  },
});

export default StudentDetails;
