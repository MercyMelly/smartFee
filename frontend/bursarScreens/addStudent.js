import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../config/index';

export default function AddStudent({ navigation }) {
    const { token, logout } = useAuthStore();

    const [formData, setFormData] = useState({
        fullName: '',
        admissionNumber: '',
        gradeLevel: '',
        gender: '',
        boardingStatus: 'Day',
        hasTransport: false,
        transportRoute: '',
        parent: {
            name: '',
            phone: '',
            email: '',
            address: '',
        },
    });

    const [loading, setLoading] = useState(false);
    const [generalMessage, setGeneralMessage] = useState(null); // For overall success/error messages
    const [messageType, setMessageType] = useState(null); // 'success' or 'error'

    // State for individual field validation errors
    const [errors, setErrors] = useState({
        fullName: '',
        admissionNumber: '',
        gradeLevel: '',
        gender: '',
        parentName: '',
        parentPhone: '',
        transportRoute: '',
    });

    const ALL_VALID_GRADES = [
        "","PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
        "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
        "Grade 10", "Grade 11", "Grade 12"
    ];
    const ALL_VALID_ROUTES = [
        "", "Senetwo", "Maraba", "Songhor", "Kamelilo",
    ];
    const GENDERS = ['Male', 'Female', 'Other'];

    // Set initial default values on component mount
    useEffect(() => {
        if (!formData.gradeLevel && ALL_VALID_GRADES.length > 1) {
            setFormData(prev => ({ ...prev, gradeLevel: ALL_VALID_GRADES[1] }));
        }
        if (!formData.boardingStatus) {
            setFormData(prev => ({ ...prev, boardingStatus: 'Day' }));
        }
    }, []);

    // Validation logic for individual fields
    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'fullName':
                if (!value.trim()) error = 'Full Name is required.';
                break;
            case 'admissionNumber':
                if (!value.trim()) error = 'Admission Number is required.';
                break;
            case 'gradeLevel':
                if (!value.trim()) error = 'Grade Level is required.';
                break;
            case 'gender':
                if (!value.trim()) error = 'Gender is required.';
                break;
            case 'parent.name':
                if (!value.trim()) error = 'Parent Name is required.';
                break;
            case 'parent.phone':
                const regex = /^\+254\d{9}$/;
                if (!value.trim()) error = 'Parent Phone is required.';
                else if (!regex.test(value.trim())) error = 'Format: +254XXXXXXXXX (e.g., +254712345678).';
                break;
            case 'transportRoute':
                if (formData.boardingStatus === 'Day' && formData.hasTransport && !value.trim()) {
                    error = 'Transport Route is required if using transport.';
                }
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [fieldName.replace('parent.', 'parent')]: error }));
        return error === ''; // Return true if valid, false if invalid
    };

    const handleChange = (field, value) => {
        // Clear general message on any input change
        setGeneralMessage(null);
        setMessageType(null);

        // Update formData
        if (field.startsWith('parent.')) {
            const parentKey = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                parent: {
                    ...prev.parent,
                    [parentKey]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }

        // Trigger immediate validation for the changed field
        validateField(field, value);
    };

    const handleSubmit = async () => {
        setGeneralMessage(null);
        setMessageType(null);
        setLoading(true);

        // Run all validations at once on submit
        const isValidFullName = validateField('fullName', formData.fullName);
        const isValidAdmissionNumber = validateField('admissionNumber', formData.admissionNumber);
        const isValidGradeLevel = validateField('gradeLevel', formData.gradeLevel);
        const isValidGender = validateField('gender', formData.gender);
        const isValidParentName = validateField('parent.name', formData.parent.name);
        const isValidParentPhone = validateField('parent.phone', formData.parent.phone);
        const isValidTransportRoute = validateField('transportRoute', formData.transportRoute);


        // Check if all fields are valid
        if (!isValidFullName || !isValidAdmissionNumber || !isValidGradeLevel || !isValidGender ||
            !isValidParentName || !isValidParentPhone || !isValidTransportRoute) {
            setGeneralMessage('Please correct the errors in the form.');
            setMessageType('error');
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                timeout: 20000,
            };

            const studentDataToSend = {
                fullName: formData.fullName.trim(),
                admissionNumber: formData.admissionNumber.trim(),
                gradeLevel: formData.gradeLevel.trim(),
                gender: formData.gender.trim(),
                boardingStatus: formData.boardingStatus.trim(),
                hasTransport: formData.hasTransport,
                transportRoute: (formData.boardingStatus === 'Day' && formData.hasTransport) ? formData.transportRoute.trim() : '',
                parent: {
                    name: formData.parent.name.trim(),
                    phone: formData.parent.phone.trim(),
                    email: formData.parent.email.trim(),
                    address: formData.parent.address.trim(),
                },
            };

            const response = await axios.post(`${BASE_URL}/students/register`, studentDataToSend, config);

            setGeneralMessage(`Student ${response.data.student.fullName} added successfully!`);
            setMessageType('success');

            // Optionally, wait a bit before navigating to allow user to see success message
            setTimeout(() => {
                navigation.goBack();
                // Reset form fields after successful submission and navigation
                setFormData({
                    fullName: '',
                    admissionNumber: '',
                    gradeLevel: ALL_VALID_GRADES[1],
                    gender: '',
                    boardingStatus: 'Day',
                    hasTransport: false,
                    transportRoute: '',
                    parent: {
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                    },
                });
                setErrors({}); // Clear all errors
                setGeneralMessage(null); // Clear message
                setMessageType(null);
            }, 1500); // Navigate after 1.5 seconds

        } catch (err) {
            console.error('Error adding student:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add student. Please check inputs and try again.';
            setGeneralMessage(errorMessage);
            setMessageType('error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            } else if (err.code === 'ECONNABORTED') {
                setGeneralMessage('Request timed out. Please check your network connection.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPicker = (label, selectedValue, onValueChange, items, fieldName, hintText = "") => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}: *</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={(itemValue) => handleChange(fieldName, itemValue)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                >
                    <Picker.Item label={`Select ${label.replace(':', '')}`} value="" enabled={false} style={{ color: '#757575' }} />
                    {items.map((item, index) => (
                        <Picker.Item key={index} label={item} value={item} />
                    ))}
                </Picker>
            </View>
            {errors[fieldName] && <Text style={styles.fieldErrorText}>{errors[fieldName]}</Text>}
            {hintText && <Text style={styles.inputHint}>{hintText}</Text>}
        </View>
    );

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>Enroll New Student</Text>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="school-outline" size={24} color="#388E3C" /> Student Details
                            </Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name: *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#757575"
                                    value={formData.fullName}
                                    onChangeText={(text) => handleChange('fullName', text)}
                                    onBlur={() => validateField('fullName', formData.fullName)}
                                    autoCapitalize="words"
                                />
                                {errors.fullName && <Text style={styles.fieldErrorText}>{errors.fullName}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Admission Number: *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter admission number"
                                    placeholderTextColor="#757575"
                                    value={formData.admissionNumber}
                                    onChangeText={(text) => handleChange('admissionNumber', text)}
                                    onBlur={() => validateField('admissionNumber', formData.admissionNumber)}
                                    autoCapitalize="characters"
                                />
                                {errors.admissionNumber && <Text style={styles.fieldErrorText}>{errors.admissionNumber}</Text>}
                            </View>

                            {renderPicker('Grade Level', formData.gradeLevel, (val) => handleChange('gradeLevel', val), ALL_VALID_GRADES.slice(1), 'gradeLevel')}
                            {renderPicker('Gender', formData.gender, (val) => handleChange('gender', val), GENDERS, 'gender')}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Boarding Status: *</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={formData.boardingStatus}
                                        onValueChange={(itemValue) => {
                                            handleChange('boardingStatus', itemValue);
                                            if (itemValue === 'Boarding' || itemValue === '') {
                                                handleChange('hasTransport', false);
                                                handleChange('transportRoute', '');
                                                setErrors(prev => ({ ...prev, transportRoute: '' })); // Clear transport error
                                            }
                                        }}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        <Picker.Item label="Select Status" value="" enabled={false} style={{ color: '#757575' }} />
                                        {['Day', 'Boarding'].map((status) => (
                                            <Picker.Item key={status} label={status} value={status} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {formData.boardingStatus === 'Day' && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Uses School Transport?</Text>
                                        <View style={styles.pickerWrapper}>
                                            <Picker
                                                selectedValue={formData.hasTransport}
                                                onValueChange={(itemValue) => {
                                                    handleChange('hasTransport', itemValue);
                                                    if (!itemValue) {
                                                        handleChange('transportRoute', '');
                                                        setErrors(prev => ({ ...prev, transportRoute: '' }));
                                                    }
                                                }}
                                                style={styles.picker}
                                                itemStyle={styles.pickerItem}
                                            >
                                                <Picker.Item label="No" value={false} />
                                                <Picker.Item label="Yes" value={true} />
                                            </Picker>
                                        </View>
                                    </View>

                                    {formData.hasTransport && (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Transport Route: *</Text>
                                            <View style={styles.pickerWrapper}>
                                                <Picker
                                                    selectedValue={formData.transportRoute}
                                                    onValueChange={(itemValue) => handleChange('transportRoute', itemValue)}
                                                    style={styles.picker}
                                                    itemStyle={styles.pickerItem}
                                                >
                                                    <Picker.Item label="Select Route" value="" enabled={false} style={{ color: '#757575' }} />
                                                    {ALL_VALID_ROUTES.slice(1).map((route) => (
                                                        <Picker.Item key={route} label={route} value={route} />
                                                    ))}
                                                </Picker>
                                            </View>
                                            {errors.transportRoute && <Text style={styles.fieldErrorText}>{errors.transportRoute}</Text>}
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="people-outline" size={24} color="#388E3C" /> Parent/Guardian Details
                            </Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Parent/Guardian Name: *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter parent/guardian full name"
                                    placeholderTextColor="#757575"
                                    value={formData.parent.name}
                                    onChangeText={(text) => handleChange('parent.name', text)}
                                    onBlur={() => validateField('parent.name', formData.parent.name)}
                                    autoCapitalize="words"
                                />
                                {errors.parentName && <Text style={styles.fieldErrorText}>{errors.parentName}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Parent/Guardian Phone: *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+254712345678"
                                    placeholderTextColor="#757575"
                                    value={formData.parent.phone}
                                    onChangeText={(text) => handleChange('parent.phone', text)}
                                    onBlur={() => validateField('parent.phone', formData.parent.phone)}
                                    keyboardType="phone-pad"
                                    maxLength={13}
                                />
                                <Text style={styles.inputHint}>Format: +254XXXXXXXXX (e.g., +254712345678)</Text>
                                {errors.parentPhone && <Text style={styles.fieldErrorText}>{errors.parentPhone}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Parent/Guardian Email (Optional):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#757575"
                                    value={formData.parent.email}
                                    onChangeText={(text) => handleChange('parent.email', text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Parent/Guardian Address (Optional):</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Enter address"
                                    placeholderTextColor="#757575"
                                    value={formData.parent.address}
                                    onChangeText={(text) => handleChange('parent.address', text)}
                                    multiline
                                />
                            </View>
                        </View>

                        {/* General Message Display */}
                        {generalMessage && (
                            <View style={[styles.messageBox, messageType === 'success' ? styles.successBox : styles.errorBox]}>
                                <Ionicons
                                    name={messageType === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                                    size={24}
                                    color={messageType === 'success' ? '#388E3C' : '#D32F2F'}
                                />
                                <Text style={messageType === 'success' ? styles.successMessage : styles.errorMessage}>{generalMessage}</Text>
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Register Student</Text>
                            )}
                        </TouchableOpacity>
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
    sectionCard: {
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
        borderColor: '#C8E6C9',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        alignSelf: 'flex-start',
        marginLeft: 5,
        marginTop: 5,
        marginBottom: 8,
        fontSize: 16,
        color: '#555',
        fontWeight: '600',
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#A5D6A7',
        borderRadius: 10,
        fontSize: 16,
        backgroundColor: '#F8F8F8',
        color: '#333',
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerWrapper: {
        width: '100%',
        borderColor: '#A5D6A7',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#F8F8F8',
        marginBottom: 15, // Adjusted to make space for error text
        overflow: 'hidden',
        height: 55,
        justifyContent: 'center',
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
    picker: {
        width: '100%',
        height: 55,
        color: '#333',
    },
    pickerItem: { // This style might not apply directly to Android Picker items
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 18,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
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
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    inputHint: {
        fontSize: 12,
        color: '#757575',
        marginTop: 5,
        fontStyle: 'italic',
    },
    fieldErrorText: {
        fontSize: 12,
        color: '#D32F2F', // Red for errors
        marginTop: 4,
        marginLeft: 5,
        fontStyle: 'italic',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 15,
        width: '100%',
    },
    errorBox: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    successBox: {
        backgroundColor: '#E8F5E9',
        borderColor: '#C8E6C9',
    },
    errorMessage: {
        color: '#D32F2F',
        marginLeft: 10,
        flexShrink: 1,
        fontSize: 14,
    },
    successMessage: {
        color: '#388E3C',
        marginLeft: 10,
        flexShrink: 1,
        fontSize: 14,
    },
});
