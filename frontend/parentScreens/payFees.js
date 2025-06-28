import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity, // Ensure this is imported
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../config'; 

export default function PayFeesScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { token, logout } = useAuthStore();

    const { studentAdmissionNumber, studentEmail, studentName, outstandingBalance, studentId } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(studentEmail || '');
    const [amount, setAmount] = useState(outstandingBalance ? outstandingBalance.toString() : '');
    const [firstName, setFirstName] = useState(studentName ? studentName.split(' ')[0] : '');
    const [lastName, setLastName] = useState(studentName ? studentName.split(' ').slice(1).join(' ') : '');
    const [admissionNumber, setAdmissionNumber] = useState(studentAdmissionNumber || '');
    const [currentStudentId, setCurrentStudentId] = useState(studentId || null);

    useEffect(() => {
        if (studentAdmissionNumber) setAdmissionNumber(studentAdmissionNumber);
        if (studentEmail) setEmail(studentEmail);
        if (studentName) {
            const nameParts = studentName.split(' ');
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(' ') || '');
        }
        if (outstandingBalance !== undefined && outstandingBalance !== null) setAmount(outstandingBalance.toString());
        if (studentId) setCurrentStudentId(studentId); 
    }, [studentAdmissionNumber, studentEmail, studentName, outstandingBalance, studentId]);


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
                                console.log(`[PayFeesScreen] Fetching student ID for admission number: ${admissionNumber}`);
                                try {
                                    const studentLookupRes = await axios.get(`${BASE_URL}/parents/students/${admissionNumber}/profile`, config);
                                    studentBackendId = studentLookupRes.data.student?._id;
                                    setCurrentStudentId(studentBackendId); 
                                } catch (lookupError) {
                                    console.error('[PayFeesScreen] Error looking up student profile:', lookupError.response?.data || lookupError.message, lookupError.code);
                                    setLoading(false); 
                                    Alert.alert('Error', lookupError.response?.data?.message || 'Failed to find student. Please check the admission number and your internet connection.');
                                    return; 
                                }
                            }

                            if (!studentBackendId) {
                                setLoading(false); 
                                Alert.alert('Error', 'Student ID could not be retrieved. Please verify the admission number.');
                                return;
                            }

                            console.log(`[PayFeesScreen] Calling backend to initialize Paystack transaction at: ${BASE_URL}/payments/initialize-paystack`);
                            
                            const initRes = await axios.post(`${BASE_URL}/payments/initialize-paystack`, {
                                studentId: studentBackendId, 
                                amount: parsedAmount, 
                                payerEmail: email,
                                studentAdmissionNumber: admissionNumber, // Pass for backend security check
                            }, config);

                            const { authorization_url } = initRes.data;

                            if (!authorization_url) {
                                throw new Error('Failed to get authorization URL from backend.');
                            }
                            
                            setLoading(false); 
                            navigation.navigate('paystack', { authorization_url: authorization_url });

                        } catch (err) {
                            setLoading(false); 
                            console.error('[PayFeesScreen] Error calling backend for Paystack initialization:', err.response?.data || err.message || err.code);
                            Alert.alert('Payment Error', err.response?.data?.message || `Failed to initiate payment setup. Please try again. Error: ${err.message || err.code}.`);
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

    const { width } = Dimensions.get('window');

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back-outline" size={28} color="#2E7D32" />
                        </TouchableOpacity>
                        <Text style={styles.mainTitle}>Make Payment</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4CAF50" style={styles.activityIndicator} />
                    ) : (
                        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Enter Payment Details</Text>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Admission Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={admissionNumber}
                                        onChangeText={setAdmissionNumber}
                                        placeholder="E.g., TDEC/001"
                                        placeholderTextColor="#9E9E9E"
                                        autoCapitalize="characters"
                                        editable={!studentAdmissionNumber} 
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="payer@example.com"
                                        placeholderTextColor="#9E9E9E"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!studentEmail} 
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Amount (KSh)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="E.g., 15000"
                                        placeholderTextColor="#9E9E9E"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>First Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="Payer's First Name"
                                        placeholderTextColor="#9E9E9E"
                                        autoCapitalize="words"
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Payer's Last Name"
                                        placeholderTextColor="#9E9E9E"
                                        autoCapitalize="words"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.payButton}
                                    onPress={initiatePaystackPayment}
                                >
                                    <Ionicons name="wallet-outline" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.payButtonText}>Proceed to Pay</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const { width } = Dimensions.get('window');

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
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#2E7D32',
    },
    activityIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingVertical: 20,
        flexGrow: 1,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#424242',
        marginBottom: 20,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderColor: '#A5D6A7',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#F1F8F4',
        color: '#333',
        fontSize: 16,
    },
    payButton: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        flexDirection: 'row',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
