import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { useNavigation } from '@react-navigation/native';

const RecordPayment = () => {
  const navigation = useNavigation();
  const [studentId, setStudentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [amountPaid, setAmountPaid] = useState('');
  const [mpesaTransactionId, setMpesaTransactionId] = useState('');
  const [cashierNotes, setCashierNotes] = useState('');

  const handleRecordPayment = async () => {
    console.log('Recording Payment:', {
      studentId,
      paymentMethod,
      amountPaid,
      mpesaTransactionId,
      cashierNotes,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Record New Payment</Text>

      <Text style={styles.label}>Student ID:</Text>
      <TextInput
        style={styles.input}
        value={studentId}
        onChangeText={setStudentId}
        placeholder="Enter Student ID"
        keyboardType="default"
      />

      <Text style={styles.label}>Payment Method:</Text>
      <Picker
        selectedValue={paymentMethod}
        onValueChange={(itemValue) => setPaymentMethod(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="MPESA" value="MPESA" />
        <Picker.Item label="Cash" value="Cash" />
      </Picker>

      <Text style={styles.label}>Amount Paid (KES):</Text>
      <TextInput
        style={styles.input}
        value={amountPaid}
        onChangeText={setAmountPaid}
        placeholder="Enter Amount"
        keyboardType="numeric"
      />

      {paymentMethod === 'MPESA' && (
        <>
          <Text style={styles.label}>MPESA Transaction ID:</Text>
          <TextInput
            style={styles.input}
            value={mpesaTransactionId}
            onChangeText={setMpesaTransactionId}
            placeholder="Enter MPESA Transaction ID"
            keyboardType="default"
          />
        </>
      )}

      <Text style={styles.label}>Notes:</Text>
      <TextInput
        style={styles.textArea}
        value={cashierNotes}
        onChangeText={setCashierNotes}
        placeholder="Any additional notes"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.recordButton} onPress={handleRecordPayment}>
        <Text style={styles.recordButtonText}>Record Payment</Text>
      </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#555',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    textAlignVertical: 'top', // For Android multiline alignment
    minHeight: 80,
  },
  recordButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default RecordPayment;