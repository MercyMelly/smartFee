import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    FlatList,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Buffer } from 'buffer'; 
import { BASE_URL } from '../config';

// Import necessary Expo modules for receipt generation
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';

export default function ParentDashboard() {
    const navigation = useNavigation();
    const { token, isLoading: authLoading, logout } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [myStudents, setMyStudents] = useState([]);
    const [currentSelectedStudent, setCurrentSelectedStudent] = useState(null);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [showStudentList, setShowStudentList] = useState(true);

    // --- Data Fetching Functions ---
    const fetchMyStudents = useCallback(async () => {
        setLoading(true);
        if (!token) {
            console.warn("[ParentDashboard] No token available for fetchMyStudents (explicit check).");
            setLoading(false);
            return;
        }
        try {
            console.log("[ParentDashboard] Fetching my students...");
            const config = {
                headers: {
                    'x-auth-token': token
                },
                timeout: 15000,
            };
            const res = await axios.get(`${BASE_URL}/parents/students`, config);
            setMyStudents(res.data);
            console.log("[ParentDashboard] My students fetched successfully:", res.data.length);
        } catch (err) {
            console.error('Error fetching my students:', err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Failed to load your children\'s list. Please ensure your contact details are updated with the school.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    const fetchStudentProfileDetails = useCallback(async (admissionNumber) => {
        setLoading(true);
        if (!token) {
            console.warn("[ParentDashboard] No token available for fetchStudentProfileDetails (explicit check).");
            setLoading(false);
            return;
        }
        try {
            console.log(`[ParentDashboard] Fetching profile for student: ${admissionNumber}`);
            const config = {
                headers: {
                    'x-auth-token': token
                },
                timeout: 15000,
            };
            const res = await axios.get(`${BASE_URL}/parents/students/${admissionNumber}/profile`, config);
            setCurrentSelectedStudent(res.data);
            setShowStudentList(false);
            console.log("[ParentDashboard] Student profile fetched:", res.data.student?.fullName);
        } catch (err) {
            console.error('Error fetching student profile details:', err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Failed to load student profile details.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    const fetchUpcomingDeadlines = useCallback(async () => {
        if (!token) {
            console.warn("[ParentDashboard] No token available for fetchUpcomingDeadlines (explicit check).");
            return;
        }
        try {
            console.log("[ParentDashboard] Fetching upcoming deadlines...");
            const config = {
                headers: {
                    'x-auth-token': token
                },
                timeout: 10000,
            };
            const res = await axios.get(`${BASE_URL}/parents/deadlines`, config);
            setUpcomingDeadlines(res.data);
            console.log("[ParentDashboard] Upcoming deadlines fetched:", res.data.length);
        } catch (err) {
            console.error('Error fetching deadlines:', err.response?.data || err.message);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        }
    }, [token, logout]);

    // Generate Receipt functionality (Adapted for Parent Dashboard)
    const handleGenerateReceipt = useCallback(async (paymentId, transactionReference) => {
        if (!token) {
            Alert.alert('Authentication Error', 'You are not logged in. Please log in to generate receipts.');
            logout();
            return;
        }

        try {
            Alert.alert('Generating Receipt', 'Please wait while we prepare your receipt...');
            const url = `${BASE_URL}/payments/generate-receipt/${paymentId}`;
            const fileName = `receipt_${transactionReference || paymentId}.pdf`;
            const downloadPath = FileSystem.documentDirectory + fileName;

            const config = {
                headers: {
                    'x-auth-token': token,
                },
                responseType: 'arraybuffer', // Crucial for receiving binary data like PDF
                timeout: 30000,
            };

            const response = await axios.get(url, config);

            // Convert ArrayBuffer to Base64 (needed for FileSystem.writeAsStringAsync with Base64 encoding)
            const pdfBase64 = Buffer.from(response.data).toString('base64');

            // Save the PDF to a local file
            await FileSystem.writeAsStringAsync(downloadPath, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });

            Alert.alert('Receipt Downloaded!', `Receipt saved to your device.`);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadPath, {
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf', // iOS specific UTI for PDF
                    dialogTitle: 'Open Receipt',
                });
            } else {
                // Fallback for devices that don't support Sharing
                if (Platform.OS === 'ios') {
                    await WebBrowser.openBrowserAsync(downloadPath);
                } else {
                    const contentUri = await FileSystem.getContentUriAsync(downloadPath);
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                        type: 'application/pdf',
                    });
                }
            }
        } catch (error) {
            console.error('Error downloading/generating receipt:', error.response?.data || error.message || error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate receipt. Please try again.');
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            } else if (error.code === 'ECONNABORTED') {
                Alert.alert('Error', 'Request timed out while generating receipt. Please try again.');
            }
        }
    }, [token, logout]);

    // --- useFocusEffect with authLoading and token checks ---
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            setMyStudents([]);
            setCurrentSelectedStudent(null);
            setUpcomingDeadlines([]);
            setShowStudentList(true);

            if (!authLoading && token) {
                fetchMyStudents();
                fetchUpcomingDeadlines();
            } else if (!authLoading && !token) {
                setLoading(false);
            }

            return () => {};
        }, [authLoading, token, fetchMyStudents, fetchUpcomingDeadlines])
    );

    const renderStudentListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.studentCard}
            onPress={() => fetchStudentProfileDetails(item.admissionNumber)}
        >
            <Ionicons name="person-outline" size={24} color="#2E7D32" style={styles.iconBeforeText} />
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.fullName}</Text>
                <Text style={styles.studentDetail}>Admission No: {item.admissionNumber}</Text>
                <Text style={styles.studentDetail}>Grade: {item.gradeLevel}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#757575" />
        </TouchableOpacity>
    );

    const renderDeadlineItem = ({ item }) => (
        <View style={styles.deadlineItem}>
            <Ionicons name="calendar-outline" size={20} color="#0288D1" style={{ marginRight: 10 }} />
            <View>
                <Text style={styles.deadlineText}>{item.term} {item.academicYear} Fee Due:</Text>
                <Text style={styles.deadlineDate}>{new Date(item.deadlineDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })}</Text>
            </View>
        </View>
    );

    // Function to navigate to PayFeesScreen
    const navigateToPayFees = () => {
        // You can pass default values if a student is already selected
        const params = currentSelectedStudent ? {
            studentAdmissionNumber: currentSelectedStudent.student?.admissionNumber,
            studentEmail: currentSelectedStudent.student?.parent?.email,
            studentName: currentSelectedStudent.student?.fullName,
            outstandingBalance: currentSelectedStudent.feeDetails?.remainingBalance,
        } : {};
        navigation.navigate('payFees', params); // 'PayFees' is the name of the new screen in your navigator
    };

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.headerContainer}>
                        <Text style={styles.mainTitle}>Parent Dashboard</Text>
                        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {(loading || authLoading) ? (
                        <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 40 }} />
                    ) : (
                        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                            {/* NEW: Global Pay Fees Button */}
                            <TouchableOpacity
                                style={styles.globalPayFeesButton}
                                onPress={navigateToPayFees}
                            >
                                <Ionicons name="cash-outline" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={styles.globalPayFeesButtonText}>Make a New Fee Payment</Text>
                            </TouchableOpacity>

                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>
                                    <Ionicons name="alert-circle-outline" size={22} color="#FF9800" /> Upcoming Deadlines
                                </Text>
                                {upcomingDeadlines.length > 0 ? (
                                    <FlatList
                                        data={upcomingDeadlines}
                                        keyExtractor={(item) => item._id}
                                        renderItem={renderDeadlineItem}
                                        scrollEnabled={false}
                                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                                    />
                                ) : (
                                    <Text style={styles.noInfoText}>No upcoming fee deadlines set.</Text>
                                )}
                            </View>

                            {showStudentList ? (
                                <View style={styles.sectionCard}>
                                    <Text style={styles.sectionTitle}>
                                        <Ionicons name="people-outline" size={22} color="#388E3C" /> My Children
                                    </Text>
                                    {myStudents.length > 0 ? (
                                        <FlatList
                                            data={myStudents}
                                            keyExtractor={(item) => item._id}
                                            renderItem={renderStudentListItem}
                                            scrollEnabled={false}
                                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                                        />
                                    ) : (
                                        <Text style={styles.noInfoText}>No students found linked to your account.</Text>
                                    )}
                                </View>
                            ) : (
                                currentSelectedStudent && (
                                    <View style={styles.profileCard}>
                                        <TouchableOpacity onPress={() => { setCurrentSelectedStudent(null); setShowStudentList(true); }} style={styles.closeProfileButton}>
                                            <Ionicons name="close-circle-outline" size={30} color="#D32F2F" />
                                        </TouchableOpacity>

                                        <Text style={styles.profileTitle}>Student Profile</Text>

                                        <Text style={styles.detailSectionTitle}>
                                            <Ionicons name="school-outline" size={20} color="#388E3C" /> Student Details
                                        </Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Full Name:</Text>
                                            <Text style={styles.detailValue}>{currentSelectedStudent.student?.fullName || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Admission No.:</Text>
                                            <Text style={styles.detailValue}>{currentSelectedStudent.student?.admissionNumber || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Grade Level:</Text>
                                            <Text style={styles.detailValue}>{currentSelectedStudent.student?.gradeLevel || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Boarding Status:</Text>
                                            <Text style={styles.detailValue}>{currentSelectedStudent.student?.boardingStatus || 'N/A'}</Text>
                                        </View>
                                        {currentSelectedStudent.student?.gender && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Gender:</Text>
                                                <Text style={styles.detailValue}>{currentSelectedStudent.student.gender}</Text>
                                            </View>
                                        )}
                                        {currentSelectedStudent.student?.hasTransport && currentSelectedStudent.student?.transportRoute && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Transport Route:</Text>
                                                <Text style={styles.detailValue}>{currentSelectedStudent.student.transportRoute}</Text>
                                            </View>
                                        )}

                                        <Text style={[styles.detailSectionTitle, { marginTop: 20 }]}>
                                            <Ionicons name="cash-outline" size={20} color="#388E3C" /> Fee Statement
                                        </Text>
                                        <View style={styles.feeItemsContainer}>
                                            {currentSelectedStudent.feeDetails?.termlyComponents && currentSelectedStudent.feeDetails.termlyComponents.length > 0 ? (
                                                currentSelectedStudent.feeDetails.termlyComponents.map((item, index) => (
                                                    <View key={index} style={styles.feeItem}>
                                                        <Text style={styles.feeItemName}>{item.name}:</Text>
                                                        <Text style={styles.feeItemAmount}>KSh {item.amount?.toLocaleString() || '0'}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noInfoText}>No fee components defined for this term.</Text>
                                            )}
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Total Termly Fee:</Text>
                                            <Text style={styles.summaryValue}>KSh {currentSelectedStudent.feeDetails?.totalTermlyFee?.toLocaleString() || '0'}</Text>
                                        </View>
                                        <View style={[styles.summaryRow, styles.paidRow]}>
                                            <Text style={styles.summaryLabel}>Fees Paid:</Text>
                                            <Text style={styles.summaryValuePaid}>KSh {currentSelectedStudent.feeDetails?.feesPaid?.toLocaleString() || '0'}</Text>
                                        </View>
                                        <View style={[styles.summaryRow, styles.balanceRow]}>
                                            <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                                            <Text style={styles.summaryValueBalance}>KSh {currentSelectedStudent.feeDetails?.remainingBalance?.toLocaleString() || '0'}</Text>
                                        </View>
                                        {currentSelectedStudent.currentFeeDeadline && (
                                            <Text style={styles.feeNotes}>
                                                <Ionicons name="information-circle-outline" size={14} color="#757575" />
                                                Next Deadline: {new Date(currentSelectedStudent.currentFeeDeadline.deadlineDate).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })} ({currentSelectedStudent.currentFeeDeadline.term} {currentSelectedStudent.currentFeeDeadline.academicYear})
                                            </Text>
                                        )}

                                        {/* OPTIONAL: Quick Pay button for selected student, navigating to PayFeesScreen */}
                                        {currentSelectedStudent.feeDetails?.remainingBalance > 0 && (
                                            <TouchableOpacity
                                                style={styles.paySelectedStudentButton}
                                                onPress={() => navigateToPayFees({ // Pass specific student details
                                                    studentAdmissionNumber: currentSelectedStudent.student?.admissionNumber,
                                                    studentEmail: currentSelectedStudent.student?.parent?.email,
                                                    studentName: currentSelectedStudent.student?.fullName,
                                                    outstandingBalance: currentSelectedStudent.feeDetails?.remainingBalance,
                                                })}
                                            >
                                                <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                                <Text style={styles.paySelectedStudentButtonText}>
                                                    Pay for {currentSelectedStudent.student?.fullName}
                                                </Text>
                                            </TouchableOpacity>
                                        )}


                                        <Text style={[styles.detailSectionTitle, { marginTop: 20 }]}>
                                            <Ionicons name="time-outline" size={20} color="#388E3C" /> Payment History
                                        </Text>
                                        <View style={styles.paymentHistoryContainer}>
                                            {currentSelectedStudent.paymentHistory && currentSelectedStudent.paymentHistory.length > 0 ? (
                                                currentSelectedStudent.paymentHistory.map((payment, index) => (
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
                                                ))
                                            ) : (
                                                <Text style={styles.noInfoText}>No payment history recorded yet.</Text>
                                            )}
                                        </View>
                                    </View>
                                )
                            )}
                        </ScrollView>
                    )}
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
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#2E7D32',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FCE4EC',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#D32F2F',
    },
    logoutButtonText: {
        color: '#D32F2F',
        marginLeft: 5,
        fontWeight: '600',
        fontSize: 14,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#388E3C',
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    noInfoText: {
        fontSize: 16,
        color: '#616161',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    iconBeforeText: {
        marginRight: 10,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#424242',
    },
    studentDetail: {
        fontSize: 14,
        color: '#757575',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 5,
        marginHorizontal: 10,
    },
    deadlineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#2196F3',
    },
    deadlineText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
    },
    deadlineDate: {
        fontSize: 14,
        color: '#424242',
        marginTop: 2,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeProfileButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
    },
    profileTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 5,
    },
    detailLabel: {
        fontSize: 16,
        color: '#616161',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: '#424242',
        fontWeight: 'normal',
        flexShrink: 1,
        textAlign: 'right',
    },
    feeItemsContainer: {
        marginBottom: 15,
        paddingLeft: 10,
    },
    feeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F5F5F5',
        paddingBottom: 3,
    },
    feeItemName: {
        fontSize: 15,
        color: '#424242',
    },
    feeItemAmount: {
        fontSize: 15,
        fontWeight: '500',
        color: '#424242',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    summaryLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333333',
    },
    summaryValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333333',
    },
    paidRow: {
        backgroundColor: '#E8F5E9',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    summaryValuePaid: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2E7D32',
    },
    balanceRow: {
        backgroundColor: '#FFEBEE',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    summaryValueBalance: {
        fontSize: 17,
        fontWeight: '700',
        color: '#D32F2F',
    },
    feeNotes: {
        fontSize: 13,
        color: '#757575',
        marginTop: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    paymentHistoryContainer: {
        paddingLeft: 0,
        marginTop: 5,
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#A5D6A7',
    },
    paymentDetailsLeft: {
        flex: 1,
    },
    paymentDate: {
        fontSize: 14,
        fontWeight: '500',
        color: '#616161',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#388E3C',
        marginTop: 2,
    },
    paymentDetailsRight: {
        alignItems: 'flex-end',
        flexShrink: 0,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    paymentMethod: {
        fontSize: 14,
        color: '#424242',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    paymentReference: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 5,
    },
    generateReceiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007BFF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    generateReceiptButtonText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
        fontWeight: '600',
    },
    // NEW Styles for Global Pay Fees Button
    globalPayFeesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0288D1', // A distinct blue for "Make a New Fee Payment"
        paddingVertical: 15,
        borderRadius: 10,
        marginVertical: 20, // Space it out from other sections
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    globalPayFeesButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    // NEW Styles for Pay button when student is selected
    paySelectedStudentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3', // Another distinct blue
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    paySelectedStudentButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
