import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PaymentHistory from './paymentHistory';
import { SafeAreaView } from 'react-native-safe-area-context';


const MakePayment = ({ route, navigation }) => {
  const { student } = route.params;

  const [paymentMethod, setPaymentMethod] = useState('mpesa'); 
  const [produceType, setProduceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
        Alert.alert('Error', 'Please select a payment method.');
        return;
    }
    if (paymentMethod === 'produce') {
        if (!produceType || !quantity || !unitValue) {
        Alert.alert('Error', 'Please fill produce type, quantity, and unit value.');
        return;
        }
    }
    if ((paymentMethod === 'mpesa' || paymentMethod === 'bank') && (!amount || !referenceNumber)) {
        Alert.alert('Error', 'Please fill amount and reference number.');
        return;
    }
    let calculatedAmount = null;
    if (paymentMethod === 'produce') {
        calculatedAmount = parseFloat(quantity) * parseFloat(unitValue);
        Alert.alert('Produce Value', `Total: KES ${calculatedAmount.toFixed(2)}`);
    }
    const payload = {
      studentId: student._id,
      paymentMethod,
      produceType: paymentMethod === 'produce' ? produceType : null,
      quantity: paymentMethod === 'produce' ? Number(quantity) : null,
      unitValue: paymentMethod === 'produce' ? Number(unitValue) : null,
      amount: paymentMethod !== 'produce' ? Number(amount) : null,
      bankName: paymentMethod === 'bank' ? bankName : null,
      referenceNumber,
    };

    try {
      const response = await fetch('http://10.71.113.17:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Payment recorded successfully!', [
          { text: 'OK', onPress: () => navigation.navigate(PaymentHistory) },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to record payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Make Payment for {student.fullName}</Text>

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
              placeholder="E.g. Maize, Beans"
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unit Value (KES)</Text>
            <TextInput
              style={styles.input}
              value={unitValue}
              onChangeText={setUnitValue}
              placeholder="Enter unit value"
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

        <TouchableOpacity style={styles.button} onPress={handlePaymentSubmit}>
          <Text style={styles.buttonText}>Submit Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2e7d32',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  picker: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default MakePayment;
