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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as FileSystem from 'expo-file-system'; 
import * as IntentLauncher from 'expo-intent-launcher'; 
import * as WebBrowser from 'expo-web-browser'; 
import * as Sharing from 'expo-sharing';

const BASE_URL = 'http://10.71.114.108:3000/api';

export default function StudentProfileScreen() {
  const [lookupAdmissionNumber, setLookupAdmissionNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  const handleLookupProfile = async () => {
    if (!lookupAdmissionNumber) {
      Alert.alert('Missing ID', 'Please enter the student\'s Admission Number.');
      return;
    }

    setLoading(true);
    setStudentProfile(null);

    try {
      const response = await axios.get(`${BASE_URL}/students/${lookupAdmissionNumber}/profile`); 
      setStudentProfile(response.data);
    } catch (error) {
      console.error('Error fetching student profile:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student profile. Please verify the Admission Number.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReceipt = async (paymentId, transactionReference) => {
    try {
        Alert.alert('Generating Receipt', 'Please wait while we prepare your receipt...');
        const url = `${BASE_URL}/payments/generate-receipt/${paymentId}`;
        const fileName = `receipt_${transactionReference || paymentId}.pdf`;
        const downloadPath = FileSystem.documentDirectory + fileName;

        const { uri } = await FileSystem.downloadAsync(url, downloadPath, {
            headers: {
                'Content-Type': 'application/pdf',
            },
        });

        Alert.alert('Receipt Downloaded!', `Receipt saved to: ${uri}`);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
                dialogTitle: 'Open Receipt',
            });
        } else {
            if (Platform.OS === 'ios') {
                await WebBrowser.openBrowserAsync(uri);
            } else {
                const contentUri = await FileSystem.getContentUriAsync(uri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1,
                    type: 'application/pdf',
                });
            }
        }
    } catch (error) {
        console.error('Error downloading/generating receipt:', error.response?.data || error.message || error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to generate receipt. Please try again.');
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
            <Text style={styles.title}>Student Profile</Text>

            <View style={styles.lookupCard}>
              <Text style={styles.lookupCardTitle}>Search Student</Text>
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
                onPress={handleLookupProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>View Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {studentProfile && (
              <View style={styles.profileCard}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="school-outline" size={24} color="#388E3C" /> Student Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Admission No.:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.admissionNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Grade Level:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.gradeLevel}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Boarding Status:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.boardingStatus}</Text>
                </View>
                {studentProfile.student.gender && ( 
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{studentProfile.student.gender}</Text>
                  </View>
                )}
                {studentProfile.student.hasTransport && studentProfile.student.transportRoute && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transport Route:</Text>
                    <Text style={styles.detailValue}>{studentProfile.student.transportRoute}</Text>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                  <Ionicons name="people-outline" size={24} color="#388E3C" /> Parent/Guardian
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.parent.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{studentProfile.student.parent.phone}</Text>
                </View>
                {studentProfile.student.parent.email && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{studentProfile.student.parent.email}</Text>
                  </View>
                )}
                {studentProfile.student.parent.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{studentProfile.student.parent.address}</Text>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                  <Ionicons name="cash-outline" size={24} color="#388E3C" /> Fee Statement (Current Term)
                </Text>
                <View style={styles.feeItemsContainer}>
                  {studentProfile.feeDetails.termlyComponents && studentProfile.feeDetails.termlyComponents.map((item, index) => (
                    <View key={index} style={styles.feeItem}>
                      <Text style={styles.feeItemName}>{item.name}:</Text>
                      <Text style={styles.feeItemAmount}>KSh {item.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Termly Fee:</Text>
                  <Text style={styles.summaryValue}>KSh {studentProfile.feeDetails.totalTermlyFee.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryRow, styles.paidRow]}>
                  <Text style={styles.summaryLabel}>Fees Paid:</Text>
                  <Text style={styles.summaryValuePaid}>KSh {studentProfile.feeDetails.feesPaid.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryRow, styles.balanceRow]}>
                  <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                  <Text style={styles.summaryValueBalance}>KSh {studentProfile.feeDetails.remainingBalance.toLocaleString()}</Text>
                </View>

                {studentProfile.feeDetails.notes && (
                  <Text style={styles.feeNotes}>
                    <Ionicons name="information-circle-outline" size={14} color="#757575" /> {studentProfile.feeDetails.notes}
                  </Text>
                )}

                {studentProfile.paymentHistory && studentProfile.paymentHistory.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                      <Ionicons name="time-outline" size={24} color="#388E3C" /> Payment History
                    </Text>
                    <View style={styles.paymentHistoryContainer}>
                      {studentProfile.paymentHistory.map((payment, index) => (
                        <View key={index} style={styles.paymentItem}>
                          <View style={styles.paymentDetailsLeft}>
                            <Text style={styles.paymentDate}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
                            <Text style={styles.paymentAmount}>KSh {payment.amountPaid.toLocaleString()}</Text>
                          </View>
                          <View style={styles.paymentDetailsRight}>
                            <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
                            {payment.transactionReference && (
                              <Text style={styles.paymentReference}>Ref: {payment.transactionReference}</Text>
                            )}

                            <TouchableOpacity
                              style={styles.generateReceiptButton}
                              onPress={() => handleGenerateReceipt(payment._id, payment.transactionReference)}
                            >
                              <Ionicons name="receipt-outline" size={16} color="#fff" />
                              <Text style={styles.generateReceiptButtonText}>Receipt</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                {studentProfile.paymentHistory && studentProfile.paymentHistory.length === 0 && (
                  <Text style={styles.noHistoryText}>No payment history recorded yet.</Text>
                )}

              </View>
            )}

            {!loading && !studentProfile && lookupAdmissionNumber && (
                <View style={styles.noResultsCard}>
                    <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                    <Text style={styles.noResultsText}>No student profile found for this Admission Number. Please verify.</Text>
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
    color: '#1B5E20', 
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  lookupCard: {
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
  },
  lookupCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#388E3C', 
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
    borderColor: '#A5D6A7', 
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#F8F8F8', 
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
    height: 55, 
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50', 
    padding: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row', 
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
  profileCard: {
    width: '100%',
    backgroundColor: '#FFFFFF', 
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
    borderColor: '#A5D6A7', 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20', 
    marginBottom: 15,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F8F6', 
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    flex: 1, 
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  feeItemsContainer: {
    marginTop: 10,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F8F6',
  },
  feeItemName: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  feeItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388E3C', 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  summaryLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  paidRow: {
    borderTopWidth: 0, 
  },
  balanceRow: {
    borderTopWidth: 2, 
    borderTopColor: '#1B5E20', 
    paddingTop: 15,
    marginTop: 15,
  },
  summaryValuePaid: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  summaryValueBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F', 
  },
  feeNotes: {
    fontSize: 13,
    color: '#757575',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  transportRouteText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  paymentHistoryContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    paddingTop: 10,
  },
  paymentItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#C8E6C9',
  },
  paymentDetailsLeft: {
    flex: 2,
    alignItems: 'flex-start',
  },
  paymentDetailsRight: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  paymentDate: {
    fontSize: 14,
    color: '#555',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 2,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  paymentReference: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  generateReceiptButton: {
    backgroundColor: '#0288D1', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateReceiptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
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