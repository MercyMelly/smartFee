import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore'; // Adjust path to your auth store

const BASE_URL = 'https://3ece-62-254-118-133.ngrok-free.app/api'; // *** IMPORTANT: Replace with your actual backend IP or domain ***

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
            const response = await axios.get(`${BASE_URL}/webhooks/pending`, config);
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


    const handleConfirmPayment = async (paymentId) => {
        if (!token) return;
        Alert.alert(
            'Confirm Payment',
            'Are you sure you want to confirm and record this payment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setLoading(true); // Indicate loading for confirmation
                            const config = {
                                headers: { 'x-auth-token': token },
                            };
                            const response = await axios.post(`${BASE_URL}/webhooks/confirm-pending/${paymentId}`, {}, config);
                            Alert.alert('Success', response.data.message);
                            fetchPendingPayments(); // Refresh the list after confirmation
                        } catch (error) {
                            console.error('Error confirming payment:', error.response?.data || error.message);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to confirm payment.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
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