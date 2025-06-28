import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Modal,
    FlatList, // This will now be the main scrollable component
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../config/index';

export default function BulkSmsScreen() {
    const { token, logout } = useAuthStore();

    const [sending, setSending] = useState(false);
    const [lastSendStatus, setLastSendStatus] = useState(null);
    const [studentsToSms, setStudentsToSms] = useState([]); // This will be the data for the main FlatList
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [isResultsModalVisible, setResultsModalVisible] = useState(false);
    const [smsDetailedResults, setSmsDetailedResults] = useState([]);

    const fetchStudentsWithOutstandingBalances = useCallback(async () => {
        setLoadingStudents(true);
        setRefreshing(true);
        setStudentsToSms([]);
        setLastSendStatus(null);
        setSmsDetailedResults([]);

        if (!token) {
            console.warn('No authentication token found. Cannot fetch student list for SMS.');
            setLoadingStudents(false);
            setRefreshing(false);
            return;
        }

        try {
            const config = { headers: { 'x-auth-token': token }, timeout: 15000 };
            const res = await axios.get(`${BASE_URL}/students?outstanding=true`, config);
            setStudentsToSms(res.data);
            console.log(`[BulkSmsScreen] Fetched ${res.data.length} students with outstanding balances.`);
        } catch (error) {
            console.error('Error fetching students with outstanding balances:', error.response?.data || error.message);
            setStudentsToSms([]);
            setLastSendStatus({
                success: false,
                message: 'Failed to load students with outstanding balances. Please check your network or try again.'
            });
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            } else if (error.code === 'ECONNABORTED') {
                 setLastSendStatus({ success: false, message: 'Request timed out while fetching students. Please try again.' });
            }
        } finally {
            setLoadingStudents(false);
            setRefreshing(false);
        }
    }, [token, logout]);

    useFocusEffect(
        useCallback(() => {
            fetchStudentsWithOutstandingBalances();
            return () => {};
        }, [fetchStudentsWithOutstandingBalances])
    );

    const onRefresh = useCallback(() => {
        fetchStudentsWithOutstandingBalances();
    }, [fetchStudentsWithOutstandingBalances]);

    const handleSendBulkSms = async () => {
        if (!token) {
            Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
            logout();
            return;
        }

        if (studentsToSms.length === 0) {
            Alert.alert('No Students to SMS', 'There are no students with outstanding fee balances to send messages to at this moment.');
            return;
        }

        Alert.alert(
            'Confirm Bulk SMS',
            `You are about to send SMS notifications to ${studentsToSms.length} parent(s) with outstanding fee balances.\n\nContinue?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Bulk SMS initiation cancelled by user.'),
                },
                {
                    text: 'Send Now',
                    onPress: async () => {
                        setSending(true);
                        setLastSendStatus(null);
                        setSmsDetailedResults([]);

                        try {
                            const config = {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-auth-token': token,
                                },
                                timeout: 90000,
                            };
                            const res = await axios.post(`${BASE_URL}/sms/send-outstanding-balances`, {}, config);
                            console.log('Bulk SMS Backend Response:', res.data);

                            if (res.data.success) {
                                setLastSendStatus({ success: true, message: res.data.msg || 'Bulk SMS initiated successfully!' });
                                setSmsDetailedResults(res.data.summary.results || []);
                                setResultsModalVisible(true);
                                fetchStudentsWithOutstandingBalances();
                            } else {
                                setLastSendStatus({ success: false, message: res.data.msg || 'Failed to initiate bulk SMS.' });
                                Alert.alert('Bulk SMS Failed', res.data.msg || 'Failed to initiate bulk SMS. Check server logs.');
                            }

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
                                Alert.alert('Error', 'Request timed out. The server took too long to respond. Please try again.');
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

    // Component to render the header content of the FlatList
    const ListHeader = () => (
        <View style={styles.containerInner}>
            <Ionicons name="mail-outline" size={80} color="#1A5319" style={styles.icon} />
            <Text style={styles.title}>Send Bulk SMS Notifications</Text>
            <Text style={styles.description}>
                Initiate automated SMS messages to parents of students with outstanding fee balances.
                Each message will include the student's name, admission number, fees paid, and the remaining balance.
            </Text>

            {loadingStudents ? (
                <ActivityIndicator size="large" color="#1A5319" style={{ marginVertical: 30 }} />
            ) : (
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        <Ionicons name="people-outline" size={20} color="#1A5319" /> {' '}
                        {studentsToSms.length} student{studentsToSms.length !== 1 ? 's' : ''} currently ha{studentsToSms.length !== 1 ? 've' : 's'} an outstanding balance.
                    </Text>
                    <Text style={styles.infoSubText}>
                        Only these {studentsToSms.length} parent{studentsToSms.length !== 1 ? 's' : ''} will receive an SMS.
                    </Text>
                </View>
            )}

            {studentsToSms.length > 0 && (
                <View style={styles.studentsListCard}>
                    <Text style={styles.listHeader}>Students to be Notified:</Text>
                </View>
            )}
        </View>
    );

    // Component to render the footer content of the FlatList
    const ListFooter = () => (
        <View style={styles.containerInner}>
            <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendBulkSms}
                disabled={sending || loadingStudents || studentsToSms.length === 0}
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
                <Ionicons name="warning-outline" size={16} color="#D32F2F" /> Ensure all student parent phone numbers in the database are correct and in international format (e.g., +254XXXXXXXXX) for successful delivery.
            </Text>
        </View>
    );

    // Render each student item in the FlatList
    const renderStudentItem = ({ item }) => (
        <View style={styles.studentListItem}>
            <Ionicons name="person-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.studentListItemText}>
                {item.fullName} (Adm: {item.admissionNumber}) - Bal: KSh {item.feeDetails.remainingBalance?.toLocaleString() || 0}
            </Text>
        </View>
    );

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <FlatList
                    data={studentsToSms}
                    keyExtractor={item => item._id}
                    renderItem={renderStudentItem}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={ListFooter}
                    ListEmptyComponent={
                        !loadingStudents && studentsToSms.length === 0 ? (
                            <View style={styles.containerInner}>
                                <Text style={styles.emptyListText}>No students with outstanding balances.</Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
                    }
                />
            </SafeAreaView>

            {/* SMS Results Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isResultsModalVisible}
                onRequestClose={() => setResultsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>SMS Delivery Report</Text>
                        <FlatList
                            data={smsDetailedResults}
                            keyExtractor={(item, index) => `${item.admissionNumber}-${index}`}
                            renderItem={({ item }) => (
                                <View style={styles.resultItem}>
                                    <Ionicons
                                        name={item.status === 'sent' ? 'checkmark-circle-outline' : item.status === 'skipped' ? 'information-circle-outline' : 'close-circle-outline'}
                                        size={20}
                                        color={item.status === 'sent' ? '#28A745' : item.status === 'skipped' ? '#FFC107' : '#DC3545'}
                                        style={styles.resultIcon}
                                    />
                                    <View style={styles.resultTextContainer}>
                                        <Text style={styles.resultStudentName}>
                                            {item.student} (Adm: {item.admissionNumber})
                                        </Text>
                                        <Text style={styles.resultStatusText}>
                                            Status: <Text style={{ fontWeight: 'bold' }}>{item.status.toUpperCase()}</Text>
                                        </Text>
                                        {item.details && <Text style={styles.resultDetailsText}>{item.details}</Text>}
                                        {item.reason && <Text style={styles.resultDetailsText}>{item.reason}</Text>}
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyListText}>No detailed results available.</Text>
                            }
                            style={styles.resultsList}
                        />
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setResultsModalVisible(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    // Main FlatList content container
    flatListContent: {
        flexGrow: 1,
        paddingVertical: 20,
        paddingHorizontal: 20, // Add horizontal padding here
    },
    // This container is now for the static elements inside Header/Footer Components
    containerInner: {
        width: '100%', // Ensure it takes full width within the FlatList content
        alignItems: 'center',
        // No fixed padding or margin here, handled by flatListContent and individual elements
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
    infoCard: {
        backgroundColor: '#E6F4EA',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A5D6A7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
    },
    infoText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1A5319',
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoSubText: {
        fontSize: 13,
        color: '#4CAF50',
        marginTop: 5,
        fontStyle: 'italic',
    },
    studentsListCard: {
        backgroundColor: '#F9FBE7',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: '#C5E1A5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    // No specific style needed for the main FlatList to manage its own height,
    // as it will naturally scroll based on its content.
    studentListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEFF1',
        width: '100%', // Ensure list items take full width
        backgroundColor: '#FFFFFF', // Add background for list items
        borderRadius: 8,
        marginBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    studentListItemText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#444',
        flex: 1, // Allow text to wrap
    },
    emptyListText: {
        textAlign: 'center',
        paddingVertical: 15,
        color: '#757575',
        fontStyle: 'italic',
    },
    sendButton: {
        backgroundColor: '#2E7D32',
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
        marginTop: 20, // Add marginTop to separate from list
        marginBottom: 20,
        minWidth: 250,
        width: '100%', // Ensure button takes full width
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
        paddingHorizontal: 10, // Added padding for warning text
    },
    // Modal Styles (unchanged, as they work independently)
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: '95%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 15,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A5319',
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    resultIcon: {
        marginTop: 2,
        marginRight: 10,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultStudentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    resultStatusText: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    resultDetailsText: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
        fontStyle: 'italic',
    },
    modalCloseButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
