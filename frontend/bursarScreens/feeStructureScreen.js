import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const BASE_URL = 'http://10.71.114.108:3000/api/fees'; 

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
        // hasTransport should be true only if BoardingStatus is 'Day'
        hasTransport: selectedBoardingStatus === 'Day',
      };

      // Only add transportRoute if a route is explicitly selected AND it's a Day scholar
      if (selectedTransportRoute && selectedBoardingStatus === 'Day') {
        params.transportRoute = selectedTransportRoute;
      }

      const response = await axios.get(`${BASE_URL}/structure`, { params });
      const feeData = response.data;

      if (feeData.transportRoutes && selectedBoardingStatus === 'Day') {
        setAvailableRoutes(['', ...Object.keys(feeData.transportRoutes).sort()]);
      } else {
        setAvailableRoutes([]);
        // If boarding status changed to not 'Day', or no transport routes available,
        // ensure selectedTransportRoute is reset
        if (selectedTransportRoute !== '') { // Only reset if it's currently set
            setSelectedTransportRoute('');
        }
      }

      // Set the fee structure. The backend's 'message' and 'availableRoutes'
      // are handled by the backend's response logic, which is good.
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

          {/* Grade Level Picker */}
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

          {/* Boarding Status Picker */}
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

          {/* Transport Route Picker (Conditionally Rendered) */}
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
                {currentFeeStructure.notes && ( // Display notes if present in the fetched data
                  <Text style={styles.feeNotes}>* {currentFeeStructure.notes}</Text>
                )}
              </View>
            )
          )}

          {/* Payment Methods Section */}
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>

            {/* M-Pesa */}
            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>1. M-Pesa</Text>
              <Text style={styles.paymentDetail}>Paybill Number: {MPESA_DETAILS.paybillNumber}</Text>
              <Text style={styles.paymentDetail}>Account Number Format: {MPESA_DETAILS.accountNumberFormat}</Text>
              <Text style={styles.paymentNotes}>{MPESA_DETAILS.notes}</Text>
            </View>

            {/* Bank Transfer */}
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

            {/* In-Kind Payments */}
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