import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Dimensions, Platform } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore'; // Assuming this path is correct
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { BASE_URL } from '../config/index';


const ParentSignupSchema = Yup.object().shape({
    fullName: Yup.string()
        .min(2, 'Full name too short')
        .max(50, 'Full name too long')
        .required('Full name is required'),
    email: Yup.string()
        .email('Invalid email')
        .required('Email is required'),
    phoneNumber: Yup.string()
        .matches(/^\+?[0-9]{10,15}$/, 'Phone number is not valid (e.g., +2547XXXXXXXX)')
        .required('Phone number is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[a-z]/, 'Must include a lowercase letter')
        .matches(/[A-Z]/, 'Must include an uppercase letter')
        .matches(/\d/, 'Must include a number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Must include a special character')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm Password is required'),
});

export default function ParentSignupScreen() {
    const navigation = useNavigation(); // Initialize navigation hook
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const login = useAuthStore((state) => state.login); // Get the login action from Zustand

    const handleParentSignup = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            const { fullName, email, phoneNumber, password } = values;

            const userData = {
                fullName,
                email,
                phoneNumber,
                password,
                // Role is NOT sent from here; it's set by the backend to 'parent'
            };

            // *** IMPORTANT: Target the new parent-specific signup endpoint ***
            const res = await axios.post(`${BASE_URL}/auth/parent-signup`, userData);

            console.log("Parent Signup successful:", res.data);

            // Use the login action from authStore to set global state and AsyncStorage
            await login(res.data);

            Alert.alert(
                'Account Created!',
                `Welcome, ${fullName}! Your parent account has been successfully created.`,
                // App.js will now handle redirection based on the 'parent' role in authStore
                [{ text: 'OK' }]
            );

        } catch (err) {
            console.error("Parent Signup error:", err.response?.data || err.message);
            Alert.alert(
                'Signup Failed',
                err.response?.data?.msg || err.message || 'An unknown error occurred during signup.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.title}>Create Parent Account</Text>
                    <Text style={styles.subtitle}>for Tindiret Educational Centre</Text>
                    <Formik
                        initialValues={{
                            fullName: '',
                            email: '',
                            phoneNumber: '',
                            password: '',
                            confirmPassword: '',
                        }}
                        validationSchema={ParentSignupSchema}
                        onSubmit={handleParentSignup}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Full Name"
                                    placeholderTextColor="#757575"
                                    onChangeText={handleChange('fullName')}
                                    onBlur={handleBlur('fullName')}
                                    value={values.fullName}
                                />
                                {touched.fullName && errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Email"
                                    placeholderTextColor="#757575"
                                    keyboardType="email-address"
                                    onChangeText={handleChange('email')}
                                    onBlur={handleBlur('email')}
                                    value={values.email}
                                    autoCapitalize="none"
                                />
                                {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Phone Number (e.g., +2547XXXXXXXX)"
                                    placeholderTextColor="#757575"
                                    keyboardType="phone-pad"
                                    onChangeText={handleChange('phoneNumber')}
                                    onBlur={handleBlur('phoneNumber')}
                                    value={values.phoneNumber}
                                />
                                {touched.phoneNumber && errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber}</Text>}

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]} // Adjust marginBottom
                                        placeholder="Password"
                                        placeholderTextColor="#757575"
                                        secureTextEntry={!showPassword}
                                        onChangeText={handleChange('password')}
                                        onBlur={handleBlur('password')}
                                        value={values.password}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                                    </TouchableOpacity>
                                </View>
                                {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]} // Adjust marginBottom
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#757575"
                                        secureTextEntry={!showConfirm}
                                        onChangeText={handleChange('confirmPassword')}
                                        onBlur={handleBlur('confirmPassword')}
                                        value={values.confirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                                        <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                                    </TouchableOpacity>
                                </View>
                                {touched.confirmPassword && errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

                                <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.buttonText} adjustsFontSizeToFit>Create Parent Account</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => navigation.navigate('login')} style={styles.loginLink}>
                                    <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight} adjustsFontSizeToFit>Login</Text></Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Formik>
                </View>
            </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
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
        color: '#2e7d32',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#4CAF50',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 48,
        borderColor: '#a5d6a7',
        borderWidth: 1,
        marginBottom: 12, // Adjusted for error messages
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f1f8f4',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, // Adjusted for error messages
        width: '100%',
        borderColor: '#a5d6a7',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#f1f8f4',
        paddingRight: 12,
    },
    eyeIcon: {
        paddingLeft: 10,
    },
    button: {
        backgroundColor: '#2e7d32',
        width: '100%',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        width: '100%',
        fontSize: 12,
        color: 'red',
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        color: '#3b3b3b',
    },
    loginHighlight: {
        color: '#2e7d32',
        fontWeight: 'bold',
    },
});
