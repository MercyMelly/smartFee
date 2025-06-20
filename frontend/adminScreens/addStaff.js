import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker'; // For role selection
import { useAuthStore } from '../store/authStore'; // Adjust path if necessary

// Define your API base URL
// IMPORTANT: Ensure this IP address is correct and accessible from your device!
const BASE_URL = 'https://300b-2c0f-fe38-2405-29ac-4d1a-39c4-f7e-d4b8.ngrok-free.app/api'; // Use the IP from your AdminHome.js

const AddStaffSchema = Yup.object().shape({
    fullName: Yup.string()
        .min(2, 'Full name too short')
        .max(50, 'Full name too long')
        .required('Full name is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    phoneNumber: Yup.string()
        .matches(/^\+?[0-9]{10,15}$/, 'Phone number is not valid (e.g., +2547XXXXXXXX)')
        .required('Phone number is required'),
    role: Yup.string()
        .oneOf(['bursar', 'admin', 'director'], 'Invalid role selected')
        .required('Role is required'),
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

export default function AddStaffScreen({ navigation }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { token } = useAuthStore(); // Get token from auth store for authenticated request

    const handleAddStaff = async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        try {
            const { fullName, email, phoneNumber, role, password } = values;

            const staffData = {
                fullName,
                email,
                phoneNumber,
                role,
                password,
            };

            // Ensure authentication token is sent with the request
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, // Send the token obtained from login/signup
                },
            };

            const res = await axios.post(`${BASE_URL}/add-staff`, staffData, config);

            console.log("Add Staff successful:", res.data);

            Alert.alert(
                'Staff Added!',
                `${fullName} (${role}) has been successfully added. They can now log in using their email and password.`,
                [{ text: 'OK', onPress: () => resetForm() }] // Clear form on success
            );

        } catch (err) {
            console.error("Add Staff error:", err.response?.data || err.message);
            Alert.alert(
                'Add Staff Failed',
                err.response?.data?.msg || err.message || 'An unknown error occurred while adding staff.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.title}>Add New Staff Member</Text>
                    <Formik
                        initialValues={{
                            fullName: '',
                            email: '',
                            phoneNumber: '',
                            role: '', // Initial empty role
                            password: '',
                            confirmPassword: '',
                        }}
                        validationSchema={AddStaffSchema}
                        onSubmit={handleAddStaff}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    onChangeText={handleChange('fullName')}
                                    onBlur={handleBlur('fullName')}
                                    value={values.fullName}
                                />
                                {touched.fullName && errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    keyboardType="email-address"
                                    onChangeText={handleChange('email')}
                                    onBlur={handleBlur('email')}
                                    value={values.email}
                                    autoCapitalize="none"
                                />
                                {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    onChangeText={handleChange('phoneNumber')}
                                    onBlur={handleBlur('phoneNumber')}
                                    value={values.phoneNumber}
                                />
                                {touched.phoneNumber && errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber}</Text>}

                                <Text style={styles.label}>Select Role:</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={values.role}
                                        style={styles.picker}
                                        onValueChange={(itemValue) => setFieldValue('role', itemValue)}
                                    >
                                        <Picker.Item label="Choose Role" value="" enabled={false} style={{ color: '#757575' }} />
                                        <Picker.Item label="Bursar" value="bursar" />
                                        <Picker.Item label="Admin" value="admin" />
                                        <Picker.Item label="Director" value="director" />
                                    </Picker>
                                </View>
                                {touched.role && errors.role && <Text style={styles.error}>{errors.role}</Text>}


                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Password"
                                        secureTextEntry={!showPassword}
                                        onChangeText={handleChange('password')}
                                        onBlur={handleBlur('password')}
                                        value={values.password}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                                    </TouchableOpacity>
                                </View>
                                {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Confirm Password"
                                        secureTextEntry={!showConfirm}
                                        onChangeText={handleChange('confirmPassword')}
                                        onBlur={handleBlur('confirmPassword')}
                                        value={values.confirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                        <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                                    </TouchableOpacity>
                                </View>
                                {touched.confirmPassword && errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

                                <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Add Staff</Text>
                                    )}
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
        color: '#333',
        fontSize: 16,
    },
    label: {
        alignSelf: 'flex-start',
        width: '100%',
        marginBottom: 8,
        fontSize: 16,
        color: '#555',
        fontWeight: '600',
        paddingLeft: 5,
    },
    pickerWrapper: {
        width: '100%',
        borderColor: '#a5d6a7',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#f1f8f4',
        marginBottom: 12, // Adjusted for error messages
        overflow: 'hidden',
        height: 48, // Match input height
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
        height: 48,
        color: '#333',
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
        paddingLeft: 5,
    },
});