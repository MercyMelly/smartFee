import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RecordPayment = () => {
  const navigation = useNavigation();
  const [studentId, setStudentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [produceType, setProduceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [bankName, setBankName] = useState('');

  const handleRecordPayment = async () => {
    if (!studentId || !paymentMethod ||
        (paymentMethod === 'produce' && (!produceType || !quantity || !unitValue)) ||
        ((paymentMethod === 'mpesa' || paymentMethod === 'bank') && (!amount || !referenceNumber)) ||
        (paymentMethod === 'bank' && !bankName)) {
      alert('Please fill all required fields.');
      return;
    }

    const payload = {
      studentId,
      paymentMethod,
      produceType: paymentMethod === 'produce' ? produceType : null,
      quantity: paymentMethod === 'produce' ? Number(quantity) : null,
      unitValue: paymentMethod === 'produce' ? Number(unitValue) : null,
      amount: paymentMethod !== 'produce' ? Number(amount) : parseFloat(quantity) * parseFloat(unitValue),
      referenceNumber,
      bankName: paymentMethod === 'bank' ? bankName : null,
    };

    try {
      const response = await fetch('http://10.71.107.212:3000/api/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Payment recorded successfully.');
        navigation.goBack();
      } else {
        alert(data.message || 'Failed to record payment.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Record Payment</Text>

        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          value={studentId}
          onChangeText={setStudentId}
          placeholder="Enter student ID"
        />

        <Text style={styles.label}>Payment Method</Text>
        <Picker
          selectedValue={paymentMethod}
          onValueChange={(itemValue) => setPaymentMethod(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Mpesa" value="mpesa" />
          <Picker.Item label="Bank" value="bank" />
          <Picker.Item label="Produce" value="produce" />
        </Picker>

        {paymentMethod === 'produce' && (
          <>
            <Text style={styles.label}>Produce Type</Text>
            <TextInput
              style={styles.input}
              value={produceType}
              onChangeText={setProduceType}
              placeholder="E.g. Maize"
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unit Value</Text>
            <TextInput
              style={styles.input}
              value={unitValue}
              onChangeText={setUnitValue}
              placeholder="Enter unit value (KES)"
              keyboardType="numeric"
            />
          </>
        )}

        {(paymentMethod === 'mpesa' || paymentMethod === 'bank') && (
          <>
            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Reference Number</Text>
            <TextInput
              style={styles.input}
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="Enter reference number"
            />
          </>
        )}

        {paymentMethod === 'bank' && (
          <>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Enter bank name"
            />
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRecordPayment}>
          <Text style={styles.buttonText}>Record Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RecordPayment;
