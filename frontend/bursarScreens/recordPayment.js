import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/index';

export default function RecordPayment({ navigation, route }) {
  
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const PAYMENT_METHODS = ['', 'M-Pesa', 'Bank Transfer'];

  const handleRecordPayment = async () => {
    if (!admissionNumber || !paymentMethod) {
      return Alert.alert('Missing', 'Admission number & payment method are required');
    }
    
    if (!amountPaid || isNaN(amountPaid)) {
      return Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
    }
    
    if (parseFloat(amountPaid) <= 0) {
      return Alert.alert('Invalid Amount', 'Payment amount must be greater than zero');
    }
    
    if (['M-Pesa', 'Bank Transfer', 'Cheque'].includes(paymentMethod) && !transactionReference.trim()) {
      return Alert.alert('Missing Reference', 'Please provide transaction reference');
    }

    setLoading(true);
    try {
      const paymentData = {
        admissionNumber,
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        transactionReference: transactionReference.trim(),
        payerName: payerName.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const resp = await axios.post(`${BASE_URL}/payments/record`, paymentData);
      Alert.alert('Success', `Payment recorded. Remaining balance: KSh ${resp.data.updatedStudentBalance.remainingBalance.toLocaleString()}`);
      resetForm();
    } catch (e) {
      console.error(e.response?.data || e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAdmissionNumber('');
    setAmountPaid('');
    setPaymentMethod('');
    setTransactionReference('');
    setPayerName('');
    setNotes('');
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Record New Payment</Text>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cash-outline" size={24} color="#388E3C" /> Payment Details
              </Text>

              <TextInput
                style={styles.input} 
                placeholder="Admission Number *"
                value={admissionNumber} 
                onChangeText={setAdmissionNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.pickerWrapper}>
                <Picker 
                  selectedValue={paymentMethod} 
                  style={styles.picker} 
                  onValueChange={setPaymentMethod}
                >
                  <Picker.Item label="Select Method" value="" enabled={false} color="#757575" />
                  {PAYMENT_METHODS.slice(1).map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
              </View>

              <TextInput 
                style={styles.input} 
                placeholder="Amount Paid *"
                value={amountPaid} 
                onChangeText={setAmountPaid} 
                keyboardType="numeric"
              />

              {['M-Pesa', 'Bank Transfer', 'Cheque'].includes(paymentMethod) && (
                <TextInput 
                  style={styles.input}
                  placeholder={
                    paymentMethod === 'M-Pesa' ? 'M-Pesa Transaction ID' :
                    paymentMethod === 'Bank Transfer' ? 'Bank Transaction Reference' :
                    'Cheque Number'
                  }
                  value={transactionReference}
                  onChangeText={setTransactionReference}
                />
              )}

              <TextInput 
                style={styles.input}
                placeholder="Payer Name (Optional)" 
                value={payerName} 
                onChangeText={setPayerName}
              />
              
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Notes (Optional)" 
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
              {loading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.buttonText}>Record Payment</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  container: { flexGrow: 1, padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#1B5E20', marginBottom: 30, textAlign: 'center' },
  sectionCard: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 15,
    padding: 20, marginBottom: 25,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  sectionTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#388E3C',
    marginBottom: 20, textAlign: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E8F5E9',
    paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  label: { alignSelf: 'flex-start', marginLeft: 5, marginTop: 5, marginBottom: 8, fontSize: 16, color: '#555', fontWeight: '600' },
  prefillLabel: { alignSelf: 'flex-start', marginLeft: 5, marginTop: 5, marginBottom: 4, fontSize: 14, color: '#777' },
  inputPrefill: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#D5E8D4', backgroundColor: '#EFEFEF', borderRadius: 8, marginBottom: 15 },
  input: {
    width: '100%', padding: 15, borderWidth: 1, borderColor: '#A5D6A7',
    borderRadius: 10, marginBottom: 15, fontSize: 16,
    backgroundColor: '#F8F8F8', color: '#333',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 2 } }),
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerWrapper: {
    width: '100%', borderColor: '#A5D6A7', borderWidth: 1, borderRadius: 10,
    backgroundColor: '#F8F8F8', marginBottom: 15, overflow: 'hidden', height: 55, justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 2 } }),
  },
  picker: { width: '100%', height: 55, color: '#333' },
  button: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});

// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     StyleSheet,
//     Alert,
//     ScrollView,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Platform,
//     Dimensions
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import axios from 'axios';
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useAuthStore } from '../store/authStore'; // Ensure this path is correct
// import { BASE_URL } from '../config/index';

// const IN_KIND_ITEM_VALUES = {
//     'Maize (90kg bag)': 4000,
//     'Millet (90kg bag)': 5000,
//     'Sorghum (90kg bag)': 4500,
//     'Beans (90kg bag)': 7000,
//     'Firewood (5-ton truck)': 25000,
// };

// export default function RecordPayment({ navigation }) {
//     const [admissionNumber, setAdmissionNumber] = useState(''); // User manually inputs this
//     const [amountPaid, setAmountPaid] = useState('');
//     const [paymentMethod, setPaymentMethod] = useState('');
//     const [transactionReference, setTransactionReference] = useState('');
//     const [payerName, setPayerName] = useState('');
//     const [notes, setNotes] = useState('');

//     const [inKindItemType, setInKindItemType] = useState('');
//     const [inKindQuantity, setInKindQuantity] = useState('');

//     const [loading, setLoading] = useState(false);
//     const { token, logout } = useAuthStore(); // Get token and logout function

//     // Re-added Cash and Cheque to the payment methods.
//     const PAYMENT_METHODS = [
//         '', 'M-Pesa', 'Bank Transfer', 'In-Kind'
//     ];

//     // Effect for In-Kind calculations
//     useEffect(() => {
//         if (paymentMethod === 'In-Kind' && inKindItemType && !isNaN(parseFloat(inKindQuantity)) && parseFloat(inKindQuantity) > 0) {
//             const valuePerUnit = IN_KIND_ITEM_VALUES[inKindItemType];
//             if (valuePerUnit) {
//                 const calculatedAmount = valuePerUnit * parseFloat(inKindQuantity);
//                 setAmountPaid(calculatedAmount.toFixed(2));
//             } else {
//                 setAmountPaid('');
//             }
//         } else if (paymentMethod !== 'In-Kind') {
//             setInKindItemType('');
//             setInKindQuantity('');
//             // If switching from In-Kind, clear amount if it was auto-calculated
//             // This is a simple heuristic; more complex logic might be needed if amountPaid could be manually set for In-Kind
//             const isAmountPreviouslyCalculated = Object.values(IN_KIND_ITEM_VALUES).some(val => parseFloat(amountPaid) === val * parseFloat(inKindQuantity));
//             if (isAmountPreviouslyCalculated) {
//                 setAmountPaid('');
//             }
//         }
//     }, [paymentMethod, inKindItemType, inKindQuantity, amountPaid]); // Added amountPaid to dependency array

//     // Effect to clear In-Kind specific fields when method changes away from In-Kind
//     useEffect(() => {
//         if (paymentMethod !== 'In-Kind') {
//             setInKindItemType('');
//             setInKindQuantity('');
//         } else {
//             // When switching to In-Kind, ensure amount is cleared for fresh calculation
//             setAmountPaid('');
//         }
//     }, [paymentMethod]);


//     const handleRecordPayment = async () => {
//         // --- Authentication Check ---
//         if (!token) {
//             Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
//             logout(); // Trigger logout from store
//             return;
//         }

//         if (!admissionNumber || !paymentMethod) {
//             Alert.alert('Missing Information', 'Please fill in Student Admission Number and Payment Method.');
//             return;
//         }

//         // Fetch student details to get the _id and full name
//         let studentData = null;
//         try {
//             const studentConfig = {
//                 headers: { 'x-auth-token': token },
//             };
//             const studentResponse = await axios.get(`${BASE_URL}/students/${admissionNumber}`, studentConfig);
//             studentData = studentResponse.data;
//         } catch (error) {
//             console.error("Error fetching student details:", error.response?.data || error.message);
//             Alert.alert("Error", error.response?.data?.message || "Student not found or failed to fetch student details. Please check the admission number.");
//             return;
//         }

//         if (!studentData || !studentData._id) {
//             Alert.alert('Error', 'Could not retrieve student details. Please try again.');
//             return;
//         }

//         let finalAmountPaid = parseFloat(amountPaid);

//         if (paymentMethod === 'In-Kind') {
//             if (!inKindItemType || isNaN(parseFloat(inKindQuantity)) || parseFloat(inKindQuantity) <= 0) {
//                 Alert.alert('In-Kind Details Missing', 'Please select In-Kind Item Type and enter a valid Quantity.');
//                 return;
//             }
//             if (isNaN(finalAmountPaid) || finalAmountPaid <= 0) {
//                 Alert.alert('Calculation Error', 'Failed to calculate amount for in-kind payment. Please re-check inputs.');
//                 return;
//             }
//         } else {
//             if (isNaN(finalAmountPaid) || finalAmountPaid <= 0) {
//                 Alert.alert('Invalid Amount', 'Amount Paid must be a positive number.');
//                 return;
//             }
//             const requiresReference = ['M-Pesa', 'Bank Transfer', 'Cheque'].includes(paymentMethod); // Added Cheque
//             if (requiresReference && (!transactionReference || transactionReference.trim() === '')) {
//                 Alert.alert('Missing Information', `Transaction Reference is required for ${paymentMethod} payments.`);
//                 return;
//             }
//         }

//         console.log('[RecordPayment] Token before Axios call:', token ? 'Present' : 'Missing');

//         setLoading(true);
//         try {
//             const config = {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'x-auth-token': token, // Send the token obtained from useAuthStore()
//                 },
//             };

//             const paymentData = {
//                 studentId: studentData._id, // Use the fetched student's _id
//                 admissionNumber: studentData.admissionNumber, // Pass the fetched admission number
//                 amountPaid: finalAmountPaid,
//                 paymentMethod,
//                 transactionReference: transactionReference || undefined,
//                 payerName: payerName || undefined,
//                 notes: notes || undefined,
//             };

//             if (paymentMethod === 'In-Kind') {
//                 paymentData.inKindItemType = inKindItemType;
//                 paymentData.inKindQuantity = parseFloat(inKindQuantity);
//             }

//             const response = await axios.post(`${BASE_URL}/payments/record`, paymentData, config);

//             console.log("Payment recorded successfully:", response.data);

//             Alert.alert(
//                 'Payment Recorded!',
//                 `Payment of KSh ${finalAmountPaid.toLocaleString()} for ${studentData.fullName} successful.\nNew balance: KSh ${response.data.updatedStudentBalance?.remainingBalance?.toLocaleString() || 'N/A'}`,
//                 [{
//                     text: 'OK',
//                     onPress: () => {
//                         // Clear form fields
//                         setAdmissionNumber('');
//                         setAmountPaid('');
//                         setPaymentMethod('');
//                         setTransactionReference('');
//                         setPayerName('');
//                         setNotes('');
//                         setInKindItemType('');
//                         setInKindQuantity('');
//                         // No navigation.goBack() here if this screen is meant to stay open for multiple payments
//                         // If it should navigate back, uncomment navigation.goBack();
//                     }
//                 }]
//             );

//         } catch (error) {
//             console.error('Error recording payment:', error.response?.data || error.message);
//             Alert.alert(
//                 'Error',
//                 error.response?.data?.message || 'Failed to record payment. Please try again.'
//             );
//             if (error.response && (error.response.status === 401 || error.response.status === 403)) {
//                 Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
//                     { text: 'OK', onPress: logout } // Use logout from auth store
//                 ]);
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
//             <SafeAreaView style={styles.safeArea}>
//                 <KeyboardAvoidingView
//                     style={styles.keyboardAvoidingView}
//                     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//                 >
//                     <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
//                         <Text style={styles.title}>Record New Payment</Text>
//                         {/* No subtitle with student name/adm no here as it's manually entered */}

//                         <View style={styles.sectionCard}>
//                             <Text style={styles.sectionTitle}>
//                                 <Ionicons name="cash-outline" size={24} color="#388E3C" /> <Text>Payment Details</Text>
//                             </Text>

//                             <Text style={styles.label}>Student Admission Number: *</Text>
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Student Admission Number"
//                                 placeholderTextColor="#757575"
//                                 value={admissionNumber}
//                                 onChangeText={setAdmissionNumber}
//                                 autoCapitalize="characters"
//                             />

//                             <Text style={styles.label}>Payment Method: *</Text>
//                             <View style={styles.pickerWrapper}>
//                                 <Picker
//                                     selectedValue={paymentMethod}
//                                     style={styles.picker}
//                                     onValueChange={(itemValue) => setPaymentMethod(itemValue)}
//                                 >
//                                     <Picker.Item label="Select Method" value="" enabled={false} style={{ color: '#757575' }} />
//                                     {PAYMENT_METHODS.slice(1).map((method) => (
//                                         <Picker.Item key={method} label={method} value={method} />
//                                     ))}
//                                 </Picker>
//                             </View>

//                             {paymentMethod === 'In-Kind' ? (
//                                 <>
//                                     <Text style={styles.label}>In-Kind Item Type: *</Text>
//                                     <View style={styles.pickerWrapper}>
//                                         <Picker
//                                             selectedValue={inKindItemType}
//                                             style={styles.picker}
//                                             onValueChange={(itemValue) => setInKindItemType(itemValue)}
//                                         >
//                                             <Picker.Item label="Select Item" value="" enabled={false} style={{ color: '#757575' }} />
//                                             {Object.keys(IN_KIND_ITEM_VALUES).map((item) => (
//                                                 <Picker.Item key={item} label={item} value={item} />
//                                             ))}
//                                         </Picker>
//                                     </View>
//                                     <Text style={styles.label}>Quantity (e.g., 2 bags, 1 truck) *</Text>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Quantity"
//                                         placeholderTextColor="#757575"
//                                         value={inKindQuantity}
//                                         onChangeText={setInKindQuantity}
//                                         keyboardType="numeric"
//                                     />
//                                     {amountPaid ? (
//                                         <Text style={styles.calculatedAmountText}>
//                                             Calculated Value: KSh {parseFloat(amountPaid).toLocaleString()}
//                                         </Text>
//                                     ) : null}
//                                 </>
//                             ) : (
//                                 <>
//                                     <Text style={styles.label}>Amount Paid (KES): *</Text>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Amount Paid"
//                                         placeholderTextColor="#757575"
//                                         value={amountPaid}
//                                         onChangeText={setAmountPaid}
//                                         keyboardType="numeric"
//                                     />
//                                 </>
//                             )}

//                             {['M-Pesa', 'Bank Transfer', 'Cheque', 'In-Kind'].includes(paymentMethod) && (
//                                 <>
//                                     <Text style={styles.label}>Transaction Reference:</Text>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder={
//                                             paymentMethod === 'M-Pesa'
//                                                 ? 'M-Pesa Transaction ID (e.g., RJ67TYU78G)'
//                                                 : paymentMethod === 'Bank Transfer'
//                                                     ? 'Bank Transaction Reference'
//                                                     : paymentMethod === 'Cheque'
//                                                         ? 'Cheque Number'
//                                                         : 'Internal Reference (e.g., INKIND-001)'
//                                         }
//                                         placeholderTextColor="#757575"
//                                         value={transactionReference}
//                                         onChangeText={setTransactionReference}
//                                     />
//                                 </>
//                             )}

//                             <Text style={styles.label}>Payer Name (Optional):</Text>
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Payer Name"
//                                 placeholderTextColor="#757575"
//                                 value={payerName}
//                                 onChangeText={setPayerName}
//                             />
//                             <Text style={styles.label}>Notes (Optional):</Text>
//                             <TextInput
//                                 style={[styles.input, styles.textArea]}
//                                 placeholder="Notes (e.g., Quality details for in-kind)"
//                                 placeholderTextColor="#757575"
//                                 value={notes}
//                                 onChangeText={setNotes}
//                                 multiline
//                             />
//                         </View>

//                         <TouchableOpacity
//                             style={styles.button}
//                             onPress={handleRecordPayment}
//                             disabled={loading}
//                         >
//                             {loading ? (
//                                 <ActivityIndicator color="#fff" />
//                             ) : (
//                                 <Text style={styles.buttonText}>Record Payment</Text>
//                             )}
//                         </TouchableOpacity>
//                     </ScrollView>
//                 </KeyboardAvoidingView>
//             </SafeAreaView>
//         </LinearGradient>
//     );
// }

// const styles = StyleSheet.create({
//     gradient: {
//         flex: 1,
//     },
//     safeArea: {
//         flex: 1,
//     },
//     keyboardAvoidingView: {
//         flex: 1,
//     },
//     container: {
//         flexGrow: 1,
//         padding: 20,
//         alignItems: 'center',
//         paddingBottom: 40,
//     },
//     title: {
//         fontSize: 30,
//         fontWeight: 'bold',
//         color: '#1B5E20',
//         marginBottom: 10, // Adjusted for manual input flow
//         textAlign: 'center',
//         letterSpacing: 0.5,
//     },
//     subtitle: { // This style is no longer used directly if student details are not pre-loaded
//         fontSize: 18,
//         color: '#4CAF50',
//         marginBottom: 30,
//         textAlign: 'center',
//         fontWeight: '600',
//     },
//     sectionCard: {
//         width: '100%',
//         backgroundColor: '#FFFFFF',
//         borderRadius: 15,
//         padding: 20,
//         marginBottom: 25,
//         ...Platform.select({
//             ios: {
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 4 },
//                 shadowOpacity: 0.1,
//                 shadowRadius: 8,
//             },
//             android: {
//                 elevation: 6,
//             },
//         }),
//         borderWidth: 1,
//         borderColor: '#C8E6C9',
//     },
//     sectionTitle: {
//         fontSize: 22,
//         fontWeight: 'bold',
//         color: '#388E3C',
//         marginBottom: 20,
//         textAlign: 'center',
//         borderBottomWidth: 1,
//         borderBottomColor: '#E8F5E9',
//         paddingBottom: 10,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     input: {
//         width: '100%',
//         padding: 15,
//         borderWidth: 1,
//         borderColor: '#A5D6A7',
//         borderRadius: 10,
//         marginBottom: 15,
//         fontSize: 16,
//         backgroundColor: '#F8F8F8',
//         color: '#333',
//         ...Platform.select({
//             ios: {
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 1 },
//                 shadowOpacity: 0.05,
//                 shadowRadius: 2,
//             },
//             android: {
//                 elevation: 2,
//             },
//         }),
//     },
//     disabledInput: { // This style is no longer directly used for admission number
//         backgroundColor: '#E0E0E0',
//         color: '#666',
//     },
//     textArea: {
//         height: 100,
//         textAlignVertical: 'top',
//     },
//     label: {
//         alignSelf: 'flex-start',
//         marginLeft: 5,
//         marginTop: 5,
//         marginBottom: 8,
//         fontSize: 16,
//         color: '#555',
//         fontWeight: '600',
//     },
//     pickerWrapper: {
//         width: '100%',
//         borderColor: '#A5D6A7',
//         borderWidth: 1,
//         borderRadius: 10,
//         backgroundColor: '#F8F8F8',
//         marginBottom: 15,
//         overflow: 'hidden',
//         height: 55,
//         justifyContent: 'center',
//         ...Platform.select({
//             ios: {
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 1 },
//                 shadowOpacity: 0.05,
//                 shadowRadius: 2,
//             },
//             android: {
//                 elevation: 2,
//             },
//         }),
//     },
//     picker: {
//         width: '100%',
//         height: 55,
//         color: '#333',
//     },
//     calculatedAmountText: {
//         alignSelf: 'flex-start',
//         marginLeft: 5,
//         marginBottom: 15,
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: '#1B5E20',
//     },
//     button: {
//         backgroundColor: '#4CAF50',
//         padding: 18,
//         borderRadius: 10,
//         width: '100%',
//         alignItems: 'center',
//         marginTop: 20,
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 20,
//         fontWeight: 'bold',
//         letterSpacing: 0.5,
//     },
//     loadingContainer: { // New style for general loading (not student-specific)
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#E8F5E9',
//         height: Dimensions.get('window').height,
//         width: Dimensions.get('window').width,
//     },
//     loadingText: { // New style for general loading text
//         marginTop: 10,
//         fontSize: 16,
//         color: '#616161',
//     },
// });
