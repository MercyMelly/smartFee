import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert,ScrollView,ActivityIndicator,KeyboardAvoidingView,Platform,} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://10.71.114.108:3000/api'; 

const IN_KIND_ITEM_VALUES = {
  'Maize (90kg bag)': 4000,
  'Millet (90kg bag)': 5000,
  'Sorghum (90kg bag)': 4500,
  'Beans (90kg bag)': 7000,
  'Firewood (5-ton truck)': 25000,
};

export default function RecordPayment({ navigation }) {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState(''); 
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');

  const [inKindItemType, setInKindItemType] = useState('');
  const [inKindQuantity, setInKindQuantity] = useState('');

  const [loading, setLoading] = useState(false);

  const PAYMENT_METHODS = [
    '', 'M-Pesa', 'Bank Transfer', 'In-Kind'
  ];

  useEffect(() => {
    if (paymentMethod === 'In-Kind' && inKindItemType && !isNaN(parseFloat(inKindQuantity)) && parseFloat(inKindQuantity) > 0) {
      const valuePerUnit = IN_KIND_ITEM_VALUES[inKindItemType];
      if (valuePerUnit) {
        const calculatedAmount = valuePerUnit * parseFloat(inKindQuantity);
        setAmountPaid(calculatedAmount.toFixed(2)); 
      } else {
        setAmountPaid(''); 
      }
    } else if (paymentMethod !== 'In-Kind' && !amountPaid) {
        setInKindItemType('');
        setInKindQuantity('');
    }
  }, [paymentMethod, inKindItemType, inKindQuantity]);

  useEffect(() => {
    if (paymentMethod !== 'In-Kind') {
      setInKindItemType('');
      setInKindQuantity('');
    } else {
        setAmountPaid('');
    }
  }, [paymentMethod]);


  const handleRecordPayment = async () => {
    if (!admissionNumber || !paymentMethod) {
      Alert.alert('Missing Information', 'Please fill in Admission Number and Payment Method.');
      return;
    }

    if (paymentMethod === 'In-Kind') {
      if (!inKindItemType || isNaN(parseFloat(inKindQuantity)) || parseFloat(inKindQuantity) <= 0) {
        Alert.alert('In-Kind Details Missing', 'Please select In-Kind Item Type and enter a valid Quantity.');
        return;
      }
      if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
        Alert.alert('Calculation Error', 'Failed to calculate amount for in-kind payment. Please re-check inputs.');
        return;
      }
    } else {
      if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
        Alert.alert('Invalid Amount', 'Amount Paid must be a positive number.');
        return;
      }
      const requiresReference = ['M-Pesa', 'Bank Transfer'].includes(paymentMethod);
      if (requiresReference && (!transactionReference || transactionReference.trim() === '')) {
        Alert.alert('Missing Information', `Transaction Reference is required for ${paymentMethod} payments.`);
        return;
      }
    }

    setLoading(true);
    try {
      const paymentData = {
        admissionNumber,
        amountPaid: parseFloat(amountPaid), 
        paymentMethod,
        transactionReference: transactionReference || undefined, 
        payerName: payerName || undefined,
        notes: notes || undefined,
      };

      if (paymentMethod === 'In-Kind') {
        paymentData.inKindItemType = inKindItemType;
        paymentData.inKindQuantity = parseFloat(inKindQuantity);
      }


      const response = await axios.post(`${BASE_URL}/payments/record`, paymentData);

      Alert.alert(
        'Payment Recorded!',
        `Payment of KSh ${parseFloat(amountPaid).toLocaleString()} for ${admissionNumber} successful.\nNew balance: KSh ${response.data.updatedStudentBalance.remainingBalance.toLocaleString()}`
      );

      setAdmissionNumber('');
      setAmountPaid('');
      setPaymentMethod('');
      setTransactionReference('');
      setPayerName('');
      setNotes('');
      setInKindItemType('');
      setInKindQuantity('');

    } catch (error) {
      console.error('Error recording payment:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Record New Payment</Text>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cash-outline" size={24} color="#388E3C" /> Payment Details
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Student Admission Number *"
                placeholderTextColor="#757575"
                value={admissionNumber}
                onChangeText={setAdmissionNumber}
                autoCapitalize="characters" 
              />

              <Text style={styles.label}>Payment Method: *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={paymentMethod}
                  style={styles.picker}
                  onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                >
                  <Picker.Item label="Select Method" value="" enabled={false} style={{ color: '#757575' }} />
                  {PAYMENT_METHODS.slice(1).map((method) => (
                    <Picker.Item key={method} label={method} value={method} />
                  ))}
                </Picker>
              </View>

              {paymentMethod === 'In-Kind' ? (
                <>
                  <Text style={styles.label}>In-Kind Item Type: *</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={inKindItemType}
                      style={styles.picker}
                      onValueChange={(itemValue) => setInKindItemType(itemValue)}
                    >
                      <Picker.Item label="Select Item" value="" enabled={false} style={{ color: '#757575' }} />
                      {Object.keys(IN_KIND_ITEM_VALUES).map((item) => (
                        <Picker.Item key={item} label={item} value={item} />
                      ))}
                    </Picker>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Quantity (e.g., 2 bags, 1 truck) *"
                    placeholderTextColor="#757575"
                    value={inKindQuantity}
                    onChangeText={setInKindQuantity}
                    keyboardType="numeric"
                  />
                  {amountPaid ? (
                    <Text style={styles.calculatedAmountText}>
                      Calculated Value: KSh {parseFloat(amountPaid).toLocaleString()}
                    </Text>
                  ) : null}
                </>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Amount Paid *"
                  placeholderTextColor="#757575"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="numeric"
                />
              )}

              {['M-Pesa', 'Bank Transfer', 'Cheque', 'In-Kind'].includes(paymentMethod) && (
                <TextInput
                  style={styles.input}
                  placeholder={
                    paymentMethod === 'M-Pesa'
                      ? 'M-Pesa Transaction ID (e.g., RJ67TYU78G)'
                      : paymentMethod === 'Bank Transfer'
                      ? 'Bank Transaction Reference'
                      : paymentMethod === 'Cheque'
                      ? 'Cheque Number'
                      : 'Internal Reference (e.g., INKIND-001)'
                  }
                  placeholderTextColor="#757575"
                  value={transactionReference}
                  onChangeText={setTransactionReference}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Payer Name (Optional)"
                placeholderTextColor="#757575"
                value={payerName}
                onChangeText={setPayerName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes (Optional: e.g., Quality details for in-kind)"
                placeholderTextColor="#757575"
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
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1B5E20', 
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF', 
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: '#C8E6C9', 
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginTop: 5,
    marginBottom: 8,
    fontSize: 16,
    color: '#555', 
    fontWeight: '600',
  },
  pickerWrapper: {
    width: '100%',
    borderColor: '#A5D6A7', 
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#F8F8F8', 
    marginBottom: 15,
    overflow: 'hidden',
    height: 55,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  picker: {
    width: '100%',
    height: 55,
    color: '#333', 
  },
  calculatedAmountText: {
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginBottom: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  button: {
    backgroundColor: '#4CAF50', 
    padding: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  //   ...Platform.select({
  //     ios: {
  //       shadowColor: '#000',
  //       shadowOffset: { width: 0, height: 4 },
  //       shadowOpacity: 0.2,
  //       shadowRadius: 6,
  //     },
  //     android: {
  //       elevation: 8,
  //     }),
  //   }),
  // },
  buttonText: {
    color: '#fff', 
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});