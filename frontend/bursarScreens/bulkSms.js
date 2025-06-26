import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // Adjust path if necessary

// IMPORTANT: Ensure this BASE_URL matches your active ngrok HTTPS URL!
// This URL will change each time you restart ngrok unless you use a fixed domain.
// Example: 'https://your-ngrok-subdomain.ngrok-free.app/api'
const BASE_URL = 'https://3ece-62-254-118-133.ngrok-free.app/api'; // <--- VERIFY THIS URL!

export default function BulkSmsScreen() {
    const { token, logout } = useAuthStore();
    const [sending, setSending] = useState(false);
    const [lastSendStatus, setLastSendStatus] = useState(null); // To display feedback

    const handleSendBulkSms = async () => {
        if (!token) {
            Alert.alert('Authentication Error', 'No token found. Please log in again.');
            logout();
            return;
        }

        Alert.alert(
            'Confirm Bulk SMS',
            'Are you sure you want to send SMS notifications to ALL parents with outstanding balances? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Bulk SMS cancelled'),
                },
                {
                    text: 'Send Now',
                    onPress: async () => {
                        setSending(true);
                        setLastSendStatus(null);
                        try {
                            const config = {
                                headers: {
                                    'x-auth-token': token,
                                },
                                timeout: 60000, // Longer timeout for bulk operations
                            };
                            const res = await axios.post(`${BASE_URL}/sms/send-outstanding-balances`, {}, config);
                            console.log('Bulk SMS Response:', res.data);
                            setLastSendStatus({ success: true, message: res.data.msg || 'Bulk SMS initiated successfully!' });
                            Alert.alert('Success', res.data.msg || 'Bulk SMS initiated. Check backend logs for details.');
                        } catch (error) {
                            console.error('Error sending bulk SMS:', error.response?.data || error.message);
                            setLastSendStatus({
                                success: false,
                                message: error.response?.data?.msg || error.message || 'An unknown error occurred while initiating bulk SMS.'
                            });
                            Alert.alert(
                                'Bulk SMS Failed',
                                error.response?.data?.msg || error.message || 'An unknown error occurred while initiating bulk SMS.'
                            );
                            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                                    { text: 'OK', onPress: logout }
                                ]);
                            } else if (error.code === 'ECONNABORTED') {
                                Alert.alert('Error', 'Request timed out while sending bulk SMS. Please try again.');
                            }
                        } finally {
                            setSending(false);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Ionicons name="mail-outline" size={80} color="#1A5319" style={styles.icon} />
                    <Text style={styles.title}>Send Bulk SMS Notifications</Text>
                    <Text style={styles.description}>
                        Initiate SMS messages to parents of students with outstanding fee balances.
                        Each message will include student name, admission number, fees paid, and remaining balance.
                    </Text>

                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendBulkSms}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send-outline" size={24} color="#fff" />
                                <Text style={styles.sendButtonText}>Send Outstanding Balances SMS</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {lastSendStatus && (
                        <View style={[styles.statusContainer, lastSendStatus.success ? styles.statusSuccess : styles.statusFail]}>
                            <Text style={styles.statusText}>
                                {lastSendStatus.message}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.warningText}>
                        <Ionicons name="warning-outline" size={16} color="#D32F2F" /> Ensure all student parent phone numbers are correct and in international format (e.g., +254XXXXXXXXX) for successful delivery.
                    </Text>
                </View>
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
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
        backgroundColor: 'rgba(255,255,255,0.9)', // Slight overlay for depth
        borderRadius: 20,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A5319',
        textAlign: 'center',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    sendButton: {
        backgroundColor: '#2E7D32', // Darker green for action
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 6,
        marginBottom: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    statusContainer: {
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    statusSuccess: {
        backgroundColor: '#D4EDDA',
        borderColor: '#28A745',
        borderWidth: 1,
    },
    statusFail: {
        backgroundColor: '#F8D7DA',
        borderColor: '#DC3545',
        borderWidth: 1,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    warningText: {
        fontSize: 13,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 20,
    },
});
