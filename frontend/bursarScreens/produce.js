import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/index';

const schoolSetPrices = {
  'firewood': 15000, 
  'beans': 140,
  'millet': 85,
  'white maize': 70,
  'sorghum': 70,
}; 

export default function ProcessProduce({ navigation, route }) {
  const [county, setCounty] = useState(route.params?.county || 'Nandi'); 
  const [market, setMarket] = useState(route.params?.market || 'Chepterit Market - Nandi');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [inKindItemType, setInKindItemType] = useState('');
  const [inKindQuantity, setInKindQuantity] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [payerName, setPayerName] = useState(''); 
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [pricePerKg, setPricePerKg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);

  const produceOptions = ['White Maize', 'Millet', 'Sorghum', 'Beans', 'Firewood'];

  useEffect(() => {
    const quantityNum = parseFloat(inKindQuantity);
    if (inKindItemType && !isNaN(quantityNum)) {  // Fixed: Added missing closing parenthesis
      fetchLatestPrice(inKindItemType);
    }
  }, [inKindItemType, inKindQuantity, county]);

  const fetchLatestPrice = async (commodity) => {
    setFetchingPrices(true);
    try {
      const fallback = schoolSetPrices[commodity.toLowerCase()];
      if (fallback) {
        setPricePerKg(fallback);
        const quantityNum = parseFloat(inKindQuantity);
        if (!isNaN(quantityNum)) {
          setAmountPaid((fallback * quantityNum * 90).toFixed(2));
        }
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    } finally {
      setFetchingPrices(false);
    }
  };

  const handleRecordPayment = async () => {
    setLoading(true);
    try {
      const paymentData = {
        admissionNumber,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod: 'In-Kind',
        transactionReference,
        payerName,
        notes,
        county,
        market,
        inKindItemType,
        inKindQuantity: parseFloat(inKindQuantity) || 0,
        inKindUnitPrice: pricePerKg || 0
      };

      await axios.post(`${BASE_URL}/payments/record-in-kind`, paymentData);
      Alert.alert('Success', 'Payment recorded successfully');
      resetForm();
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdmissionNumber('');
    setInKindItemType('');
    setInKindQuantity('');
    setTransactionReference('');
    setPayerName('');
    setNotes('');
    setAmountPaid('');
    setPricePerKg(null);
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Record Produce Payment</Text>
            <Text style={styles.subtitle}>County: {county} | Market: {market}</Text>
            
            <View style={styles.sectionCard}>
              <TextInput
                style={styles.input}
                placeholder="Admission Number"
                value={admissionNumber}
                onChangeText={setAdmissionNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Produce Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={inKindItemType}
                  onValueChange={setInKindItemType}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Produce" value="" />
                  {produceOptions.map((item, i) => (
                    <Picker.Item key={i} label={item} value={item} />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Quantity (90kg bags)"
                value={inKindQuantity}
                onChangeText={setInKindQuantity}
                keyboardType="numeric"
              />

              {pricePerKg && (
                <View style={styles.priceInfo}>
                  <Text style={styles.priceText}>Price: KSh {pricePerKg}/kg</Text>
                  <Text style={styles.priceText}>Total: KSh {amountPaid}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Reference"
                value={transactionReference}
                onChangeText={setTransactionReference}
              />

              <TextInput
                style={styles.input}
                placeholder="Payer Name"
                value={payerName}
                onChangeText={setPayerName}
              />

              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRecordPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Record Payment</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1 
  },
  keyboardAvoidingView: {
    flex: 1
  },
  container: { 
    padding: 20,
    paddingBottom: 40
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: '#2E7D32',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 20,
    textAlign: 'center'
  },
  sectionCard: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  label: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 5,
    marginTop: 10
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden'
  },
  picker: { 
    height: 50, 
    width: '100%' 
  },
  input: { 
    height: 40, 
    borderColor: 'gray', 
    borderWidth: 1, 
    marginBottom: 10, 
    padding: 10,
    borderRadius: 5
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  priceInfo: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  priceText: {
    fontSize: 14,
    color: '#2E7D32'
  },
  button: { 
    backgroundColor: '#4CAF50', 
    padding: 15, 
    borderRadius: 5, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16
  }
});