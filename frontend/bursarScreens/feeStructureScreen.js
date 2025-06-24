import React, { useState, useEffect, useCallback } from 'react';
import {View,Text,TouchableOpacity,StyleSheet,ScrollView,ActivityIndicator,Alert,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const BASE_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api/fees'; 

const SCHOOL_BANK_DETAILS = {
  bankName: "Equity Bank Kenya",
  accountName: "ABC School Fees Account",
  accountNumber: "XXXXXXXXXXXXX",
  branch: "Main Branch",
  swiftCode: "EQBLKENAXXX",
  notes: "Please include student's full name and admission number as reference."
};

const MPESA_DETAILS = {
  paybillNumber: "XXXXXX",
  accountNumberFormat: "StudentAdmissionNo / StudentFullName",
  notes: "Follow the prompts, enter the Paybill number and account number as specified. Always confirm the recipient name before completing the transaction."
};

const IN_KIND_PAYMENT_DETAILS = {
  acceptedItems: [
    { name: "Bags of Maize", unit: "90kg bag", valuePerUnit: 4000 },
    { name: "Bags of Millet", unit: "90kg bag", valuePerUnit: 5000 },
    { name: "Bags of Sorghum", unit: "90kg bag", valuePerUnit: 4500 },
    { name: "Bags of Beans", unit: "90kg bag", valuePerUnit: 7000 },
    { name: "Trucks of Firewood", unit: "5-ton truck", valuePerUnit: 25000 }
  ],
  process: [
    "Contact the school Bursar's office to schedule a delivery time.",
    "Items will be inspected for quality and quantity upon arrival.",
    "The market value of the goods will be assessed and credited towards the student's fees.",
    "A receipt detailing the goods received and their equivalent monetary value will be issued."
  ],
  notes: "All in-kind payments are subject to quality inspection and valuation by the school. Prior arrangement is mandatory."
};

export default function FeeStructure() {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedBoardingStatus, setSelectedBoardingStatus] = useState('');
  const [selectedTransportRoute, setSelectedTransportRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFeeStructure, setCurrentFeeStructure] = useState(null);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableRoutes, setAvailableRoutes] = useState([]);

  const ALL_VALID_GRADES = [
    "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
    "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
    "Grade 10", "Grade 11", "Grade 12"
  ];

  useEffect(() => {
    setAvailableGrades(['', ...ALL_VALID_GRADES.sort()]);
    if (ALL_VALID_GRADES.length > 0) {
      setSelectedGrade(ALL_VALID_GRADES[0]); 
    }
  }, []);

  const fetchFeeStructure = useCallback(async () => {
    if (!selectedGrade || !selectedBoardingStatus) {
      setCurrentFeeStructure(null);
      setAvailableRoutes([]); 
      setSelectedTransportRoute(''); 
      return;
    }

    setLoading(true);
    setCurrentFeeStructure(null); 
    try {
      const params = {
        gradeLevel: selectedGrade,
        boardingStatus: selectedBoardingStatus,
        hasTransport: selectedBoardingStatus === 'Day',
      };
      if (selectedTransportRoute && selectedBoardingStatus === 'Day') {
        params.transportRoute = selectedTransportRoute;
      }

      const response = await axios.get(`${BASE_URL}/structure`, { params });
      const feeData = response.data;

      if (feeData.transportRoutes && selectedBoardingStatus === 'Day') {
        setAvailableRoutes(['', ...Object.keys(feeData.transportRoutes).sort()]);
      } else {
        setAvailableRoutes([]);
        if (selectedTransportRoute !== '') { 
            setSelectedTransportRoute('');
        }
      }
      setCurrentFeeStructure(feeData);

    } catch (error) {
      console.error('Error fetching fee structure:', error.response?.data || error.message);
      let errorMessage = 'Failed to fetch fee structure.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection or backend server URL.';
      }
      Alert.alert('Error', errorMessage);
      setCurrentFeeStructure(null);
      setAvailableRoutes([]);
      setSelectedTransportRoute(''); 
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedBoardingStatus, selectedTransportRoute]); 

  useEffect(() => {
    fetchFeeStructure();
  }, [fetchFeeStructure]); 


  useEffect(() => {
    if (selectedBoardingStatus === 'Boarding' || selectedBoardingStatus === '') {
      setSelectedTransportRoute('');
      setAvailableRoutes([]);
    }
  }, [selectedBoardingStatus]); 


  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>School Fee Structure</Text>

          <Text style={styles.label}>Select Grade Level:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedGrade}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedGrade(itemValue)}
            >
              <Picker.Item label="Choose Grade" value="" enabled={false} style={{ color: '#757575' }} />
              {availableGrades.map((grade) => (
                grade !== '' ? <Picker.Item key={grade} label={grade} value={grade} /> : null
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Select Boarding Status:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBoardingStatus}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedBoardingStatus(itemValue)}
            >
              <Picker.Item label="Choose Status" value="" enabled={false} style={{ color: '#757575' }} />
              <Picker.Item label="Day" value="Day" />
              <Picker.Item label="Boarding" value="Boarding" />
            </Picker>
          </View>

          {selectedBoardingStatus === 'Day' && availableRoutes.length > 0 && (
            <>
              <Text style={styles.label}>Select Transport Route (Optional):</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTransportRoute}
                  style={styles.picker}
                  onValueChange={(itemValue) => setSelectedTransportRoute(itemValue)}
                >
                  <Picker.Item label="No School Transport" value="" />
                  {availableRoutes.map((route) => (
                    route !== '' ? <Picker.Item key={route} label={route} value={route} /> : null
                  ))}
                </Picker>
              </View>
            </>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#4caf50" style={styles.loadingIndicator} />
          ) : (
            currentFeeStructure && (
              <View style={styles.feeDetailsCard}>
                <Text style={styles.cardTitle}>
                  Fee Details for {currentFeeStructure.gradeLevel} - {currentFeeStructure.boardingStatus}
                  {currentFeeStructure.hasTransport && selectedTransportRoute ? ` (${selectedTransportRoute} Route)` : ''}
                </Text>
                {currentFeeStructure.termlyComponents && currentFeeStructure.termlyComponents.map((item, index) => (
                  <View key={index} style={styles.feeItem}>
                    <Text style={styles.feeItemName}>{item.name}:</Text>
                    <Text style={styles.feeItemAmount}>KSh {item.amount.toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.totalFeeRow}>
                  <Text style={styles.totalFeeText}>Total Termly Fee:</Text>
                  <Text style={styles.totalFeeAmount}>KSh {currentFeeStructure.finalTotal ? currentFeeStructure.finalTotal.toLocaleString() : currentFeeStructure.totalCalculated.toLocaleString()}</Text>
                </View>
                {currentFeeStructure.notes && (
                  <Text style={styles.feeNotes}>* {currentFeeStructure.notes}</Text>
                )}
              </View>
            )
          )}

          <View style={styles.paymentMethodsSection}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>1. M-Pesa</Text>
              <Text style={styles.paymentDetail}>Paybill Number: {MPESA_DETAILS.paybillNumber}</Text>
              <Text style={styles.paymentDetail}>Account Number Format: {MPESA_DETAILS.accountNumberFormat}</Text>
              <Text style={styles.paymentNotes}>{MPESA_DETAILS.notes}</Text>
            </View>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>2. Bank Transfer</Text>
              <Text style={styles.paymentDetail}>Bank Name: {SCHOOL_BANK_DETAILS.bankName}</Text>
              <Text style={styles.paymentDetail}>Account Name: {SCHOOL_BANK_DETAILS.accountName}</Text>
              <Text style={styles.paymentDetail}>Account Number: {SCHOOL_BANK_DETAILS.accountNumber}</Text>
              <Text style={styles.paymentDetail}>Branch: {SCHOOL_BANK_DETAILS.branch}</Text>
              {SCHOOL_BANK_DETAILS.swiftCode && (
                <Text style={styles.paymentDetail}>SWIFT Code: {SCHOOL_BANK_DETAILS.swiftCode}</Text>
              )}
              <Text style={styles.paymentNotes}>{SCHOOL_BANK_DETAILS.notes}</Text>
            </View>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>3. In-Kind Payments (Goods)</Text>
              <Text style={styles.paymentDetail}>We accept payments in the form of:</Text>
              {IN_KIND_PAYMENT_DETAILS.acceptedItems.map((item, index) => (
                <Text key={index} style={styles.inKindItem}>
                  - {item.name} ({item.unit}) - Est. KSh {item.valuePerUnit.toLocaleString()} per unit
                </Text>
              ))}
              <Text style={styles.paymentDetail}>Process:</Text>
              {IN_KIND_PAYMENT_DETAILS.process.map((step, index) => (
                <Text key={index} style={styles.inKindProcessStep}>
                  {index + 1}. {step}
                </Text>
              ))}
              <Text style={styles.paymentNotes}>{IN_KIND_PAYMENT_DETAILS.notes}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pickerContainer: {
    width: '100%',
    borderColor: '#2e7d32',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  feeDetailsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
    textAlign: 'center',
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  feeItemName: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  feeItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2e7d32',
  },
  totalFeeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  totalFeeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  feeNotes: {
    fontSize: 12,
    color: '#757575',
    marginTop: 10,
    fontStyle: 'italic',
  },
  paymentMethodsSection: {
    width: '100%',
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  paymentDetail: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
  },
  paymentNotes: {
    fontSize: 13,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 10,
  },
  inKindItem: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    marginBottom: 3,
  },
  inKindProcessStep: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 3,
  },
});


// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Picker } from '@react-native-picker/picker';
// import axios from 'axios';
// import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any icon library you prefer

// // You'd get the SCHOOL_ID and AUTH_TOKEN from user login context or secure storage
// // This is crucial for multi-tenancy (multiple schools)
// const SCHOOL_ID = 'your_logged_in_school_id_here'; // This must be dynamic
// const AUTH_TOKEN = 'your_auth_token_here'; // This must be dynamic
// const BASE_API_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api'; // Your backend API base URL

// export default function ManageFeeStructureScreen() {
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [selectedGrade, setSelectedGrade] = useState('');
//   const [selectedBoardingStatus, setSelectedBoardingStatus] = useState('');
//   const [feeComponents, setFeeComponents] = useState([]);
//   const [inKindItems, setInKindItems] = useState([]);
//   const [paymentMethods, setPaymentMethods] = useState({ mpesa: null, bankTransfer: null });
//   const [transportRoutes, setTransportRoutes] = useState([]); // Manage transport routes
//   const [selectedTransportRouteToEdit, setSelectedTransportRouteToEdit] = useState(''); // For editing specific transport route fee

//   const ALL_VALID_GRADES = [
//     "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
//     "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
//     "Grade 10", "Grade 11", "Grade 12"
//   ];
//   const BOARDING_STATUSES = ["Day", "Boarding"];

//   // --- Fetch Data from Backend ---
//   const fetchSchoolData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Fetch fee components for selected grade/boarding
//       const feeResponse = await axios.get(
//         `${BASE_API_URL}/schools/${SCHOOL_ID}/fee-structures`,
//         {
//           headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
//           params: { gradeLevel: selectedGrade, boardingStatus: selectedBoardingStatus },
//         }
//       );

//       if (feeResponse.data.length > 0) {
//         // Assuming your backend returns a single fee structure for a given grade/boarding
//         const feeStructure = feeResponse.data[0];
//         setFeeComponents(feeStructure.components || []);
//         setTransportRoutes(feeStructure.transportRoutes || []); // Assuming transport routes are part of fee structure
//       } else {
//         setFeeComponents([]);
//         setTransportRoutes([]);
//       }
//       setSelectedTransportRouteToEdit(''); // Reset transport route selection on new grade/boarding

//       // Fetch in-kind items
//       const inKindResponse = await axios.get(
//         `${BASE_API_URL}/schools/${SCHOOL_ID}/in-kind-items`,
//         { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//       );
//       setInKindItems(inKindResponse.data);

//       // Fetch payment methods
//       const paymentResponse = await axios.get(
//         `${BASE_API_URL}/schools/${SCHOOL_ID}/payment-methods`,
//         { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//       );
//       const mpesa = paymentResponse.data.find(pm => pm.method_type === 'M-Pesa');
//       const bankTransfer = paymentResponse.data.find(pm => pm.method_type === 'Bank Transfer');
//       setPaymentMethods({ mpesa, bankTransfer });

//     } catch (error) {
//       console.error('Error fetching school data:', error.response?.data || error.message);
//       Alert.alert('Error', 'Failed to load school settings. Please try again.');
//       setFeeComponents([]);
//       setInKindItems([]);
//       setPaymentMethods({ mpesa: null, bankTransfer: null });
//       setTransportRoutes([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedGrade, selectedBoardingStatus]); // Depend on grade/boarding selection

//   useEffect(() => {
//     if (selectedGrade && selectedBoardingStatus) {
//       fetchSchoolData();
//     } else {
//       // Clear data if no selection is made
//       setFeeComponents([]);
//       setInKindItems([]);
//       setPaymentMethods({ mpesa: null, bankTransfer: null });
//       setTransportRoutes([]);
//     }
//   }, [selectedGrade, selectedBoardingStatus, fetchSchoolData]);

//   // --- Handlers for Fee Components ---
//   const handleFeeComponentChange = (index, field, value) => {
//     const updatedComponents = [...feeComponents];
//     updatedComponents[index][field] = value;
//     setFeeComponents(updatedComponents);
//   };

//   const addFeeComponent = () => {
//     setFeeComponents([...feeComponents, { name: '', amount: '', currency: 'KES' }]);
//   };

//   const removeFeeComponent = (index) => {
//     Alert.alert(
//       "Confirm Deletion",
//       "Are you sure you want to remove this fee component?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           onPress: () => {
//             const updatedComponents = feeComponents.filter((_, i) => i !== index);
//             setFeeComponents(updatedComponents);
//           },
//           style: "destructive",
//         },
//       ]
//     );
//   };

//   // --- Handlers for In-Kind Items ---
//   const handleInKindItemChange = (index, field, value) => {
//     const updatedItems = [...inKindItems];
//     updatedItems[index][field] = value;
//     setInKindItems(updatedItems);
//   };

//   const addInKindItem = () => {
//     setInKindItems([...inKindItems, { item_name: '', unit: '', estimated_value: '', currency: 'KES' }]);
//   };

//   const removeInKindItem = (index) => {
//     Alert.alert(
//       "Confirm Deletion",
//       "Are you sure you want to remove this in-kind item?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           onPress: () => {
//             const updatedItems = inKindItems.filter((_, i) => i !== index);
//             setInKindItems(updatedItems);
//           },
//           style: "destructive",
//         },
//       ]
//     );
//   };

//   // --- Handlers for Payment Methods ---
//   const handlePaymentMethodChange = (methodType, field, value) => {
//     setPaymentMethods(prev => ({
//       ...prev,
//       [methodType]: {
//         ...prev[methodType],
//         [field]: value,
//       },
//     }));
//   };

//   // --- Handlers for Transport Routes ---
//   const handleTransportRouteFeeChange = (routeIndex, value) => {
//     const updatedRoutes = [...transportRoutes];
//     updatedRoutes[routeIndex].fee = value;
//     setTransportRoutes(updatedRoutes);
//   };

//   const addTransportRoute = () => {
//     setTransportRoutes([...transportRoutes, { name: '', fee: '' }]);
//   };

//   const removeTransportRoute = (index) => {
//     Alert.alert(
//       "Confirm Deletion",
//       "Are you sure you want to remove this transport route?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           onPress: () => {
//             const updatedRoutes = transportRoutes.filter((_, i) => i !== index);
//             setTransportRoutes(updatedRoutes);
//           },
//           style: "destructive",
//         },
//       ]
//     );
//   };

//   // --- Save Changes to Backend ---
//   const saveAllChanges = async () => {
//     setSaving(true);
//     try {
//       // 1. Save/Update Fee Structure and Components
//       // You'll need to send the entire fee structure for the selected grade/boarding
//       // or implement more granular PUT/POST for components.
//       // For simplicity here, let's assume one PUT updates the whole structure.
//       const feeStructurePayload = {
//         grade_level: selectedGrade,
//         boarding_status: selectedBoardingStatus,
//         components: feeComponents.map(comp => ({
//           name: comp.name,
//           amount: parseFloat(comp.amount) || 0, // Ensure number
//           currency: comp.currency || 'KES',
//         })),
//         transportRoutes: transportRoutes.map(route => ({ // Include transport routes
//           name: route.name,
//           fee: parseFloat(route.fee) || 0,
//         })),
//       };

//       // Check if a fee structure already exists for this grade/boarding.
//       // In a real app, you'd fetch the existing ID or have an upsert endpoint.
//       const existingFeeStructureResponse = await axios.get(
//         `${BASE_API_URL}/schools/${SCHOOL_ID}/fee-structures`,
//         {
//           headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
//           params: { gradeLevel: selectedGrade, boardingStatus: selectedBoardingStatus },
//         }
//       );

//       if (existingFeeStructureResponse.data.length > 0) {
//         const existingId = existingFeeStructureResponse.data[0].id;
//         await axios.put(
//           `${BASE_API_URL}/schools/${SCHOOL_ID}/fee-structures/${existingId}`,
//           feeStructurePayload,
//           { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//         );
//       } else {
//         await axios.post(
//           `${BASE_API_URL}/schools/${SCHOOL_ID}/fee-structures`,
//           feeStructurePayload,
//           { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//         );
//       }

//       // 2. Save/Update In-Kind Items (assuming full replacement or individual updates)
//       // This might involve deleting all existing and re-creating, or individual PUTs/POSTs
//       await axios.put(
//         `${BASE_API_URL}/schools/${SCHOOL_ID}/in-kind-items`, // Endpoint to update all in-kind items
//         inKindItems.map(item => ({
//           item_name: item.item_name,
//           unit: item.unit,
//           estimated_value: parseFloat(item.estimated_value) || 0,
//           currency: item.currency || 'KES',
//         })),
//         { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//       );

//       // 3. Save/Update Payment Methods
//       if (paymentMethods.mpesa) {
//         await axios.put(
//           `${BASE_API_URL}/schools/${SCHOOL_ID}/payment-methods/${paymentMethods.mpesa.id}`,
//           {
//             method_type: 'M-Pesa',
//             details: {
//               paybill_number: paymentMethods.mpesa.details.paybill_number,
//               account_number_format: paymentMethods.mpesa.details.account_number_format,
//             },
//             instructions: paymentMethods.mpesa.instructions,
//           },
//           { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//         );
//       }
//       if (paymentMethods.bankTransfer) {
//         await axios.put(
//           `${BASE_API_URL}/schools/${SCHOOL_ID}/payment-methods/${paymentMethods.bankTransfer.id}`,
//           {
//             method_type: 'Bank Transfer',
//             details: {
//               bank_name: paymentMethods.bankTransfer.details.bank_name,
//               account_name: paymentMethods.bankTransfer.details.account_name,
//               account_number: paymentMethods.bankTransfer.details.account_number,
//               branch: paymentMethods.bankTransfer.details.branch,
//               swift_code: paymentMethods.bankTransfer.details.swift_code,
//             },
//             instructions: paymentMethods.bankTransfer.instructions,
//           },
//           { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
//         );
//       }

//       Alert.alert('Success', 'Fee structure and payment settings saved successfully!');
//     } catch (error) {
//       console.error('Error saving changes:', error.response?.data || error.message);
//       Alert.alert('Error', 'Failed to save changes. Please check your input and try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
//       <SafeAreaView style={{ flex: 1 }}>
//         <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//           <Text style={styles.title}>Manage School Fee Structure</Text>

//           {/* Grade and Boarding Status Selection */}
//           <Text style={styles.label}>Select Grade Level:</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={selectedGrade}
//               style={styles.picker}
//               onValueChange={(itemValue) => setSelectedGrade(itemValue)}
//             >
//               <Picker.Item label="-- Select Grade --" value="" enabled={false} style={{ color: '#757575' }} />
//               {ALL_VALID_GRADES.map((grade) => (
//                 <Picker.Item key={grade} label={grade} value={grade} />
//               ))}
//             </Picker>
//           </View>

//           <Text style={styles.label}>Select Boarding Status:</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={selectedBoardingStatus}
//               style={styles.picker}
//               onValueChange={(itemValue) => setSelectedBoardingStatus(itemValue)}
//             >
//               <Picker.Item label="-- Choose Status --" value="" enabled={false} style={{ color: '#757575' }} />
//               {BOARDING_STATUSES.map((status) => (
//                 <Picker.Item key={status} label={status} value={status} />
//               ))}
//             </Picker>
//           </View>

//           {loading ? (
//             <ActivityIndicator size="large" color="#4caf50" style={styles.loadingIndicator} />
//           ) : (
//             selectedGrade && selectedBoardingStatus && (
//               <>
//                 {/* Fee Components Section */}
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionCardTitle}>Fee Components</Text>
//                   {feeComponents.length === 0 && <Text style={styles.noDataText}>No fee components set for this selection. Add new ones below.</Text>}
//                   {feeComponents.map((item, index) => (
//                     <View key={index} style={styles.editableItemRow}>
//                       <TextInput
//                         style={[styles.input, { flex: 2, marginRight: 8 }]}
//                         placeholder="Fee Name (e.g., Tuition Fee)"
//                         value={item.name}
//                         onChangeText={(text) => handleFeeComponentChange(index, 'name', text)}
//                       />
//                       <TextInput
//                         style={[styles.input, { flex: 1, marginRight: 8 }]}
//                         placeholder="Amount"
//                         keyboardType="numeric"
//                         value={String(item.amount)}
//                         onChangeText={(text) => handleFeeComponentChange(index, 'amount', text)}
//                       />
//                       <Text style={styles.currencyLabel}>KES</Text>
//                       <TouchableOpacity onPress={() => removeFeeComponent(index)}>
//                         <Icon name="delete" size={24} color="#f44336" style={{ marginLeft: 8 }} />
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                   <TouchableOpacity style={styles.addButton} onPress={addFeeComponent}>
//                     <Text style={styles.addButtonText}>Add New Fee Component</Text>
//                   </TouchableOpacity>
//                 </View>

//                 {/* Transport Routes Section (if applicable for Day scholars) */}
//                 {selectedBoardingStatus === 'Day' && (
//                   <View style={styles.sectionCard}>
//                     <Text style={styles.sectionCardTitle}>Transport Routes (Day Scholars)</Text>
//                     {transportRoutes.length === 0 && <Text style={styles.noDataText}>No transport routes set. Add new ones below.</Text>}
//                     {transportRoutes.map((route, index) => (
//                       <View key={index} style={styles.editableItemRow}>
//                         <TextInput
//                           style={[styles.input, { flex: 2, marginRight: 8 }]}
//                           placeholder="Route Name (e.g., Maraba)"
//                           value={route.name}
//                           onChangeText={(text) => handleTransportRouteFeeChange(index, 'name', text)} // Changed this to update name
//                         />
//                         <TextInput
//                           style={[styles.input, { flex: 1, marginRight: 8 }]}
//                           placeholder="Fee"
//                           keyboardType="numeric"
//                           value={String(route.fee)}
//                           onChangeText={(text) => handleTransportRouteFeeChange(index, text)} // Changed to update fee directly
//                         />
//                         <Text style={styles.currencyLabel}>KES</Text>
//                         <TouchableOpacity onPress={() => removeTransportRoute(index)}>
//                           <Icon name="delete" size={24} color="#f44336" style={{ marginLeft: 8 }} />
//                         </TouchableOpacity>
//                       </View>
//                     ))}
//                     <TouchableOpacity style={styles.addButton} onPress={addTransportRoute}>
//                       <Text style={styles.addButtonText}>Add New Transport Route</Text>
//                     </TouchableOpacity>
//                   </View>
//                 )}


//                 {/* In-Kind Payments Section */}
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionCardTitle}>In-Kind Payments (Goods)</Text>
//                   {inKindItems.length === 0 && <Text style={styles.noDataText}>No in-kind items set. Add new ones below.</Text>}
//                   {inKindItems.map((item, index) => (
//                     <View key={index} style={styles.editableItemRow}>
//                       <TextInput
//                         style={[styles.input, { flex: 2, marginRight: 8 }]}
//                         placeholder="Item Name (e.g., Bags of Maize)"
//                         value={item.item_name}
//                         onChangeText={(text) => handleInKindItemChange(index, 'item_name', text)}
//                       />
//                       <TextInput
//                         style={[styles.input, { flex: 1, marginRight: 8 }]}
//                         placeholder="Unit (e.g., 90kg bag)"
//                         value={item.unit}
//                         onChangeText={(text) => handleInKindItemChange(index, 'unit', text)}
//                       />
//                       <TextInput
//                         style={[styles.input, { flex: 1, marginRight: 8 }]}
//                         placeholder="Est. Value"
//                         keyboardType="numeric"
//                         value={String(item.estimated_value)}
//                         onChangeText={(text) => handleInKindItemChange(index, 'estimated_value', text)}
//                       />
//                       <Text style={styles.currencyLabel}>KES</Text>
//                       <TouchableOpacity onPress={() => removeInKindItem(index)}>
//                         <Icon name="delete" size={24} color="#f44336" style={{ marginLeft: 8 }} />
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                   <TouchableOpacity style={styles.addButton} onPress={addInKindItem}>
//                     <Text style={styles.addButtonText}>Add New In-Kind Item</Text>
//                   </TouchableOpacity>
//                 </View>

//                 {/* Payment Methods Section */}
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionCardTitle}>Payment Methods Details</Text>

//                   {/* M-Pesa */}
//                   <View style={styles.paymentMethodEditCard}>
//                     <Text style={styles.paymentMethodEditTitle}>M-Pesa</Text>
//                     <Text style={styles.label}>Paybill Number:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Paybill Number"
//                       keyboardType="numeric"
//                       value={paymentMethods.mpesa?.details?.paybill_number || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('mpesa', 'details', { ...paymentMethods.mpesa?.details, paybill_number: text })}
//                     />
//                     <Text style={styles.label}>Account Number Format:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="e.g., StudentAdmissionNo / StudentFullName"
//                       value={paymentMethods.mpesa?.details?.account_number_format || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('mpesa', 'details', { ...paymentMethods.mpesa?.details, account_number_format: text })}
//                     />
//                     <Text style={styles.label}>Instructions:</Text>
//                     <TextInput
//                       style={styles.textArea}
//                       placeholder="Enter M-Pesa instructions"
//                       multiline
//                       value={paymentMethods.mpesa?.instructions || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('mpesa', 'instructions', text)}
//                     />
//                   </View>

//                   {/* Bank Transfer */}
//                   <View style={styles.paymentMethodEditCard}>
//                     <Text style={styles.paymentMethodEditTitle}>Bank Transfer</Text>
//                     <Text style={styles.label}>Bank Name:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="e.g., Equity Bank Kenya"
//                       value={paymentMethods.bankTransfer?.details?.bank_name || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'details', { ...paymentMethods.bankTransfer?.details, bank_name: text })}
//                     />
//                     <Text style={styles.label}>Account Name:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="e.g., ABC School Fees Account"
//                       value={paymentMethods.bankTransfer?.details?.account_name || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'details', { ...paymentMethods.bankTransfer?.details, account_name: text })}
//                     />
//                     <Text style={styles.label}>Account Number:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Account Number"
//                       keyboardType="numeric"
//                       value={paymentMethods.bankTransfer?.details?.account_number || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'details', { ...paymentMethods.bankTransfer?.details, account_number: text })}
//                     />
//                     <Text style={styles.label}>Branch:</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="e.g., Main Branch"
//                       value={paymentMethods.bankTransfer?.details?.branch || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'details', { ...paymentMethods.bankTransfer?.details, branch: text })}
//                     />
//                     <Text style={styles.label}>SWIFT Code (Optional):</Text>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="e.g., EQBLKENAXXX"
//                       value={paymentMethods.bankTransfer?.details?.swift_code || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'details', { ...paymentMethods.bankTransfer?.details, swift_code: text })}
//                     />
//                     <Text style={styles.label}>Instructions:</Text>
//                     <TextInput
//                       style={styles.textArea}
//                       placeholder="Enter bank transfer instructions"
//                       multiline
//                       value={paymentMethods.bankTransfer?.instructions || ''}
//                       onChangeText={(text) => handlePaymentMethodChange('bankTransfer', 'instructions', text)}
//                     />
//                   </View>
//                 </View>

//                 {/* Save Button */}
//                 <TouchableOpacity
//                   style={styles.saveButton}
//                   onPress={saveAllChanges}
//                   disabled={saving || loading || !selectedGrade || !selectedBoardingStatus}
//                 >
//                   {saving ? (
//                     <ActivityIndicator color="#fff" />
//                   ) : (
//                     <Text style={styles.saveButtonText}>Save All Changes</Text>
//                   )}
//                 </TouchableOpacity>
//               </>
//             )
//           )}
//         </ScrollView>
//       </SafeAreaView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   gradient: {
//     flex: 1,
//   },
//   container: {
//     padding: 20,
//     alignItems: 'center',
//     paddingBottom: 40,
//   },
//   title: {
//     fontSize: 26,
//     color: '#2e7d32',
//     fontWeight: 'bold',
//     marginBottom: 25,
//     textAlign: 'center',
//   },
//   label: {
//     alignSelf: 'flex-start',
//     marginLeft: 5,
//     marginTop: 10,
//     marginBottom: 5,
//     fontSize: 15,
//     color: '#333',
//     fontWeight: '500',
//   },
//   pickerContainer: {
//     width: '100%',
//     borderColor: '#2e7d32',
//     borderWidth: 1,
//     borderRadius: 10,
//     backgroundColor: '#fff',
//     marginBottom: 15,
//     overflow: 'hidden',
//     height: 50,
//     justifyContent: 'center',
//   },
//   picker: {
//     width: '100%',
//     height: 50,
//     color: '#333',
//   },
//   loadingIndicator: {
//     marginTop: 50,
//   },
//   noDataText: {
//     fontSize: 16,
//     color: '#757575',
//     textAlign: 'center',
//     marginTop: 10,
//     marginBottom: 15,
//   },
//   sectionCard: {
//     width: '100%',
//     backgroundColor: '#ffffff',
//     borderRadius: 10,
//     padding: 15,
//     marginTop: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionCardTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2e7d32',
//     marginBottom: 15,
//     textAlign: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingBottom: 10,
//   },
//   editableItemRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   input: {
//     flex: 1,
//     height: 45,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     fontSize: 15,
//     backgroundColor: '#f9f9f9',
//     color: '#333',
//   },
//   currencyLabel: {
//     marginLeft: 5,
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#555',
//   },
//   addButton: {
//     backgroundColor: '#4caf50',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 15,
//     alignSelf: 'center',
//   },
//   addButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   paymentMethodEditCard: {
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   paymentMethodEditTitle: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#388e3c',
//     marginBottom: 10,
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#ddd',
//     paddingBottom: 8,
//   },
//   textArea: {
//     height: 80,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     fontSize: 15,
//     backgroundColor: '#f9f9f9',
//     color: '#333',
//     textAlignVertical: 'top', // For Android
//   },
//   saveButton: {
//     backgroundColor: '#2e7d32',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     marginTop: 30,
//     width: '100%',
//     alignItems: 'center',
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });