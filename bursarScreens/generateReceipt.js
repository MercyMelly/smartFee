import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GenerateReceipt = () => {
  const navigation = useNavigation();
  const [transactionId, setTransactionId] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  const handleSearchTransaction = async () => {
    if (!transactionId) {
      setError('Please enter a transaction ID.');
      return;
    }

    setError('');
    setReceiptData(null);

    try {
      const response = await fetch(`http://192.168.0.27:3000/api/payments/receipt/${transactionId}`);
      if (!response.ok) {
        throw new Error('Receipt not found');
      }

      const data = await response.json();
      setReceiptData(data);
    } catch (err) {
      setError(err.message || 'Error fetching receipt');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Generate Receipt</Text>

        <TextInput
          style={styles.input}
          value={transactionId}
          onChangeText={setTransactionId}
          placeholder="Enter Transaction ID"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSearchTransaction}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

        {receiptData && (
          <View style={styles.receiptBox}>
            <Text style={styles.receiptItem}>Transaction ID: {receiptData.transactionId}</Text>
            <Text style={styles.receiptItem}>Student ID: {receiptData.studentId}</Text>
            <Text style={styles.receiptItem}>Payment Method: {receiptData.paymentMethod}</Text>
            <Text style={styles.receiptItem}>Amount Paid: KES {receiptData.amountPaid}</Text>
            <Text style={styles.receiptItem}>Date: {receiptData.date}</Text>
            <Text style={styles.receiptItem}>Notes: {receiptData.cashierNotes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
    safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  receiptBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  receiptItem: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default GenerateReceipt;
