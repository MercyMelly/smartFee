import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Assuming Ionicons is used for eye icons

// Import BASE_URL from your centralized config file
import { BASE_URL } from '../config'; 

export default function ForgotPassword({ navigation }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState(''); // New state for new password
    const [confirmNewPassword, setConfirmNewPassword] = useState(''); // New state for confirming new password
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP, 3: Reset Password
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false); // For toggling visibility
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false); // For toggling visibility

    const handleSendOtp = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }
        setLoading(true);
        try {
            // Use BASE_URL
            const res = await axios.post(`${BASE_URL}/password/send-otp`, { email });
            Alert.alert('OTP Sent', res.data.message || 'Please check your email for the OTP.');
            setStep(2); // Move to OTP verification step
        } catch (err) {
            console.log("Send OTP Error:", err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Could not send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtpAndPrepareReset = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP.');
            return;
        }
        setLoading(true);
        try {
            // Use BASE_URL
            const res = await axios.post(`${BASE_URL}/password/verify-otp`, { email, otp });
            const { token: receivedResetToken } = res.data; 
            
            // Store the reset token in AsyncStorage temporarily
            await AsyncStorage.setItem('tempResetToken', receivedResetToken); 

            Alert.alert('OTP Verified', 'You can now set your new password.');
            setStep(3); // Move to password reset step
        } catch (err) {
            console.log("Verify OTP Error:", err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmNewPassword) {
            Alert.alert('Error', 'Please enter and confirm your new password.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        // Basic password strength validation (can expand with Yup if desired)
        if (newPassword.length < 8 ||
            !/[a-z]/.test(newPassword) ||
            !/[A-Z]/.test(newPassword) ||
            !/\d/.test(newPassword) ||
            !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            Alert.alert('Error', 'Password must be at least 8 characters and include uppercase, lowercase, number, and a special character.');
            return;
        }

        setLoading(true);
        try {
            const tempResetToken = await AsyncStorage.getItem('tempResetToken'); // Retrieve the token

            if (!tempResetToken) {
                Alert.alert('Error', 'Reset session expired. Please restart the forgot password process.');
                setStep(1); // Go back to start
                setLoading(false);
                return;
            }

            // Use BASE_URL
            const res = await axios.post(`${BASE_URL}/password/reset-password`, {
                token: tempResetToken, // Use the token obtained from verifyOtp
                newPassword: newPassword,
            });

            Alert.alert('Password Reset', res.data.message || 'Your password has been successfully reset. You can now login.');
            await AsyncStorage.removeItem('tempResetToken'); // Clean up the temporary token
            navigation.replace('login'); // Navigate back to login
        } catch (err) {
            console.log("Reset Password Error:", err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Could not reset password. Please try again or request a new OTP.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
            <View style={styles.card}>
                <Text style={styles.title}>Forgot Password</Text>

                {step === 1 && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#757575"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('login')} style={styles.link}>
                            <Text style={styles.linkText}>Back to Login</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 2 && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter OTP"
                            placeholderTextColor="#757575"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                        />
                        <TouchableOpacity style={styles.button} onPress={handleVerifyOtpAndPrepareReset} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.link}>
                            <Text style={styles.linkText} adjustsFontSizeToFit>Back to Email</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 3 && (
                    <>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]} // Adjust marginBottom for input in container
                                placeholder="New Password"
                                placeholderTextColor="#757575"
                                secureTextEntry={!showNewPassword}
                                onChangeText={setNewPassword}
                                value={newPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]} // Adjust marginBottom for input in container
                                placeholder="Confirm New Password"
                                placeholderTextColor="#757575"
                                secureTextEntry={!showConfirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                value={confirmNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirmNewPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.link}>
                            <Text style={styles.linkText} adjustsFontSizeToFit>Start Over</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </LinearGradient>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.9,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2e7d32',
    },
    input: {
        height: 50,
        width: '100%',
        borderWidth: 1,
        borderColor: '#a5d6a7', // Light green border for consistency
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        backgroundColor: '#f1f8f4',
        color: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#a5d6a7', // Light green border for consistency
        borderRadius: 8,
        paddingRight: 12,
        marginBottom: 15,
        backgroundColor: '#f1f8f4',
    },
    eyeIcon: {
        paddingLeft: 10, // Add some padding to the eye icon
    },
    button: {
        backgroundColor: '#2e7d32',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#2e7d32', // Add shadow to button
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    link: { // Changed from linkText to link for consistency with Login.js
        marginTop: 15,
        alignSelf: 'center', // Center the link
    },
    linkText: {
        color: '#2e7d32',
        fontSize: 14,
        textDecorationLine: 'underline', // Add underline for better link visibility
    },
});
