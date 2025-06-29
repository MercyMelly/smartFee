import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore'; // Adjust path to your auth store
import { BASE_URL } from '../config'; // Ensure BASE_URL is correct here


export default function PendingPaymentsScreen() {
    const { token } = useAuthStore(); // Get auth token from your global store
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingPayments = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const config = {
                headers: { 'x-auth-token': token },
            };
            const response = await axios.get(`${BASE_URL}/payments/pending`, config);
            setPendingPayments(response.data);
        } catch (error) {
            console.error('Error fetching pending payments:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to load pending payments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // Use useFocusEffect to refresh data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setLoading(true); // Show loading state when screen is focused
            fetchPendingPayments();
        }, [fetchPendingPayments])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPendingPayments();
    }, [fetchPendingPayments]);


    const initiatePaystackPayment = async () => {
    if (!admissionNumber || !email || !amount || parseFloat(amount) <= 0) {
        Alert.alert('Missing Information', 'Please fill in Admission Number, Email, and a valid Amount.');
        return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid positive number for the amount.');
        return;
    }
    
    if (!token) {
        Alert.alert('Authentication Required', 'You need to be logged in to make payments. Please log in.');
        logout();
        return;
    }

    Alert.alert(
        "Confirm Payment",
        `You are about to pay KSh ${parsedAmount.toLocaleString()} for student with Admission No: ${admissionNumber}. Do you wish to proceed?`,
        [
        { text: "Cancel", style: "cancel" },
        {
            text: "Pay Now",
            onPress: async () => {
            setLoading(true); 
            try {
                const config = {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json',
                },
                timeout: 20000,
                };

                let studentBackendId = currentStudentId;
                if (!studentBackendId) {
                try {
                    const studentLookupRes = await axios.get(`${BASE_URL}/parents/students/${admissionNumber}/profile`, config);
                    studentBackendId = studentLookupRes.data.student?._id;
                    setCurrentStudentId(studentBackendId); 
                } catch (lookupError) {
                    console.error('Error looking up student profile:', lookupError);
                    setLoading(false); 
                    Alert.alert('Error', 'Failed to find student. Please check the admission number and your internet connection.');
                    return; 
                }
                }

                if (!studentBackendId) {
                setLoading(false); 
                Alert.alert('Error', 'Student ID could not be retrieved. Please verify the admission number.');
                return;
                }

                const initRes = await axios.post(`${BASE_URL}/payments/initialize-paystack`, {
                studentId: studentBackendId, 
                amount: parsedAmount, 
                payerEmail: email,
                studentAdmissionNumber: admissionNumber,
                metadata: { // Critical for auto-confirmation
                    studentId: studentBackendId,
                    paymentSource: 'parent_app',
                    payerUserId: currentUserId, // From your auth store
                    studentAdmissionNumber: admissionNumber
                }
                }, config);

                const { authorization_url } = initRes.data;

                if (!authorization_url) {
                throw new Error('Failed to get authorization URL from backend.');
                }
                
                setLoading(false); 
                navigation.navigate('paystack', { 
                authorization_url: authorization_url,
                onSuccess: () => {
                    Alert.alert('Success', 'Payment completed successfully! You will receive a confirmation shortly.');
                }
                });

            } catch (err) {
                setLoading(false); 
                console.error('Error calling backend for Paystack initialization:', err);
                Alert.alert('Payment Error', `Failed to initiate payment setup. Please try again. Error: ${err.message}`);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
                }
            }
            }
        }
        ]
    );
    };
    const renderItem = ({ item }) => (
        <View style={styles.paymentCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.studentName}>
                    <Ionicons name="person-circle-outline" size={20} color="#2E7D32" />{' '}
                    {item.student ? item.student.fullName : 'Student Not Linked'}
                </Text>
                {item.student && <Text style={styles.admissionNumber}>Adm No: {item.student.admissionNumber}</Text>}
                {!item.student && item.admissionNumberUsed &&
                    <Text style={styles.admissionNumberWarning}>Attempted Adm No: {item.admissionNumberUsed}</Text>
                }
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.detailText}>
                    <Ionicons name="wallet-outline" size={16} color="#616161" /> Amount:{' '}
                    <Text style={styles.amountText}>KSh {item.amount.toLocaleString()}</Text>
                </Text>
                <Text style={styles.detailText}>
                    <Ionicons name="card-outline" size={16} color="#616161" /> Method: {item.paymentMethod}
                </Text>
                <Text style={styles.detailText}>
                    <Ionicons name="receipt-outline" size={16} color="#616161" /> Ref: {item.gatewayTransactionId}
                </Text>
                {item.payerDetails.phone && (
                    <Text style={styles.detailText}>
                        <Ionicons name="call-outline" size={16} color="#616161" /> Payer Phone: {item.payerDetails.phone}
                    </Text>
                )}
                <Text style={styles.detailText}>
                    <Ionicons name="calendar-outline" size={16} color="#616161" /> Date: {new Date(item.paidAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.cardActions}>
                {item.status === 'pending' && (
                    // Only show confirm button if student is linked, or if you build manual linking UI
                    (item.student || item.admissionNumberUsed) ? (
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => handleConfirmPayment(item._id)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.manualLinkNeededText}>Manual Link Needed</Text>
                        // You'd ideally have a button here to allow bursar to select student manually
                        // e.g., <TouchableOpacity onPress={() => navigateToManualLink(item._id)}><Text>Link Student</Text></TouchableOpacity>
                    )
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading pending payments...</Text>
            </View>
        );
    }

    if (pendingPayments.length === 0) {
        return (
            <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.fullScreenGradient}>
                <View style={styles.centeredContainer}>
                    <Ionicons name="cash-outline" size={80} color="#757575" />
                    <Text style={styles.emptyText}>No pending payments to review.</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <Ionicons name="refresh-circle-outline" size={24} color="#2e7d32" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.fullScreenGradient}>
            <SafeAreaView style={{ flex: 1 }}>
                <Text style={styles.screenTitle}>Pending Payments</Text>
                <FlatList
                    data={pendingPayments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                    }
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    fullScreenGradient: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#616161',
    },
    emptyText: {
        fontSize: 18,
        color: '#757575',
        marginTop: 15,
        textAlign: 'center',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: '#E8F5E9',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A5D6A7',
    },
    refreshButtonText: {
        color: '#2e7d32',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: 'bold',
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1B5E20',
        textAlign: 'center',
        marginVertical: 20,
        letterSpacing: 0.5,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#C8E6C9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    cardHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    admissionNumber: {
        fontSize: 14,
        color: '#616161',
        marginTop: 2,
    },
    admissionNumberWarning: {
        fontSize: 14,
        color: '#D32F2F', // Red for warning
        fontStyle: 'italic',
        marginTop: 2,
    },
    cardBody: {
        marginBottom: 10,
    },
    detailText: {
        fontSize: 15,
        color: '#424242',
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountText: {
        fontWeight: 'bold',
        color: '#1B5E20',
    },
    cardActions: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end', // Align button to the right
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        elevation: 2,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    manualLinkNeededText: {
        fontSize: 14,
        color: '#FF9800',
        fontStyle: 'italic',
        fontWeight: 'bold',
    }
});