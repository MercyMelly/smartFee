import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView, // For better keyboard handling
  Platform, // For platform-specific styles
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For a nice background
import { SafeAreaView } from 'react-native-safe-area-context'; // For safe area handling
import { Ionicons } from '@expo/vector-icons'; // For icons
import axios from 'axios';

const BASE_URL = 'http://10.71.113.17:3000/api'; // Your backend API base URL

export default function StudentFeesLookupScreen() {
  const [lookupAdmissionNumber, setLookupAdmissionNumber] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [studentFeeDetails, setStudentFeeDetails] = useState(null);

  const handleLookupFees = async () => {
    if (!lookupAdmissionNumber) {
      Alert.alert('Missing ID', 'Please enter the student\'s Admission Number.');
      return;
    }

    setLoading(true);
    setStudentFeeDetails(null); // Clear previous details

    try {
      // Ensure your backend expects 'admissionNumber' or adjust here
      const response = await axios.get(`${BASE_URL}/students/${lookupAdmissionNumber}/fees`);

      // Backend response structure might vary. Adjust data access based on your actual API output.
      // Assuming response.data directly contains:
      // {
      //   studentDetails: { fullName, admissionNumber, gradeLevel, boardingStatus, hasTransport, transportRoute },
      //   termlyComponents: [{ name, amount }],
      //   finalTotal: number,
      //   notes: string (optional)
      // }
      setStudentFeeDetails(response.data);
    } catch (error) {
      console.error('Error fetching student fees:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student fees. Please check the Admission Number.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Student Fee Lookup</Text>

            <View style={styles.inputCard}>
              <Text style={styles.inputCardTitle}>Find Student Fees</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="search-outline" size={20} color="#757575" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Student Admission No."
                  placeholderTextColor="#757575"
                  value={lookupAdmissionNumber}
                  onChangeText={setLookupAdmissionNumber}
                  autoCapitalize="none"
                  keyboardType="default"
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLookupFees}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Lookup Fees</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {studentFeeDetails && (
              <View style={styles.feeDetailsCard}>
                <Text style={styles.cardTitle}>
                  <Ionicons name="cash-outline" size={22} color="#1B5E20" /> Fee Statement for{' '}
                  {studentFeeDetails.studentDetails.fullName || `${studentFeeDetails.studentDetails.firstName} ${studentFeeDetails.studentDetails.lastName}`}
                </Text>
                <Text style={styles.cardSubtitle}>
                  Grade: {studentFeeDetails.studentDetails.gradeLevel} | Status: {studentFeeDetails.studentDetails.boardingStatus}
                </Text>

                {studentFeeDetails.studentDetails.hasTransport && studentFeeDetails.studentDetails.transportRoute && (
                  <Text style={styles.transportRouteText}>
                    <Ionicons name="bus-outline" size={16} color="#388E3C" /> Transport Route: {studentFeeDetails.studentDetails.transportRoute}
                  </Text>
                )}

                <View style={styles.feeItemsContainer}>
                  {studentFeeDetails.termlyComponents && studentFeeDetails.termlyComponents.map((item, index) => (
                    <View key={index} style={styles.feeItem}>
                      <Text style={styles.feeItemName}>{item.name}:</Text>
                      <Text style={styles.feeItemAmount}>KSh {item.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalFeeRow}>
                  <Text style={styles.totalFeeText}>Total Termly Fee:</Text>
                  <Text style={styles.totalFeeAmount}>KSh {studentFeeDetails.finalTotal.toLocaleString()}</Text>
                </View>

                {studentFeeDetails.notes && (
                  <Text style={styles.feeNotes}>
                    <Ionicons name="information-circle-outline" size={14} color="#757575" /> {studentFeeDetails.notes}
                  </Text>
                )}
              </View>
            )}

            {!loading && !studentFeeDetails && lookupAdmissionNumber && (
                <View style={styles.noResultsCard}>
                    <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                    <Text style={styles.noResultsText}>No fee details found for this student. Please verify the Admission Number.</Text>
                </View>
            )}

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
    color: '#1B5E20', // Primary Green
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputCard: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Neutral
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
    borderColor: '#C8E6C9', // Secondary Green for border
  },
  inputCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#388E3C', // Secondary Green
    marginBottom: 20,
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#A5D6A7', // Secondary Green for input border
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#F8F8F8', // Neutral
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
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55, // Consistent height
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50', // Secondary Green for the button
    padding: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row', // For icon and text
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  feeDetailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Neutral
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
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
    borderColor: '#A5D6A7', // Secondary Green for border
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20', // Primary Green
    marginBottom: 5,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#388E3C', // Secondary Green
    marginBottom: 10,
    textAlign: 'center',
  },
  transportRouteText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  feeItemsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9', // Light green separator
    paddingTop: 10,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F8F6', // Very light green line
  },
  feeItemName: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  feeItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388E3C', // Secondary Green for amounts
  },
  totalFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#2e7d32', // Darker green for emphasis
  },
  totalFeeText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1B5E20', // Primary Green
  },
  totalFeeAmount: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1B5E20', // Primary Green
  },
  feeNotes: {
    fontSize: 13,
    color: '#757575',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noResultsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
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
  },
  noResultsText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
});