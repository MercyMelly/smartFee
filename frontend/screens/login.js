import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure this is the correct import for Ionicons
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore'; // Assuming this path is correct
import { BASE_URL } from '../config';

const UserDetailSchema = Yup.object().shape({
    email: Yup.string()
        .email('Enter a valid email')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

export default function Login({ navigation }) {
    const [secureText, setSecureText] = useState(true);
    const login = useAuthStore((state) => state.login);

    const handleLogin = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            // Update endpoint to the new general login route
            const res = await axios.post(`${BASE_URL}/auth/login`, values); // Corrected endpoint to include /auth

            // Destructure updated fields from the backend response
            const { token, user } = res.data; // `user` object includes role and other details

            if (!token) {
                Alert.alert('Login Failed', 'Login succeeded but no token was returned.');
                return;
            }

            // Call the login action from your Zustand store with updated data
            // This will update the `token`, `role`, and `user` state globally.
            await login({ token, user }); // Pass token and user object to authStore.login

            // App.js will then automatically re-render and navigate based on `token` and `role` state.
            Alert.alert('Success', 'Logged in successfully!', [{ text: 'OK' }]);

        } catch (err) {
            console.error("Login Error:", err.response?.data || err.message);
            Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
            <View style={styles.card}>
                {/* <Image source={require('../assets/student.jpeg')} style={styles.logo} resizeMode="contain" /> */}

                <Text style={styles.title}>FeeHarvest</Text>
                <Text style={styles.subtitle}>Your School Fee Management System for Tindiret Educational Centre</Text>

                <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={UserDetailSchema}
                    onSubmit={handleLogin}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#757575"
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                value={values.email}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#757575"
                                    secureTextEntry={secureText}
                                    onChangeText={handleChange('password')}
                                    onBlur={handleBlur('password')}
                                    value={values.password}
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                    <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                                </TouchableOpacity>
                            </View>
                            {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.buttonText}>Login</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('signup')} style={styles.link}>
                                <Text style={styles.linkText}>Staff? <Text style={styles.linkHighlight}>Sign Up Here</Text></Text>
                            </TouchableOpacity>
                            
                            {/* --- NEW PARENT SIGNUP LINK --- */}
                            <TouchableOpacity onPress={() => navigation.navigate('ParentSignup')} style={styles.link}>
                                <Text style={styles.linkText}>Parent? <Text style={styles.linkHighlight}>Create Account</Text></Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')} style={styles.link}>
                                <Text style={styles.linkText} adjustsFontSizeToFit>Forgot Password?</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Formik>
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
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#4CAF50',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#a5d6a7',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#f1f8f4',
        color: '#333',
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderColor: '#a5d6a7',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#f1f8f4',
        marginBottom: 10,
    },
    eyeIcon: {
        padding: 10,
    },
    button: {
        backgroundColor: '#2e7d32',
        width: '100%',
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        fontSize: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: -5, // Adjust to pull error closer to input
    },
    link: {
        marginTop: 15,
    },
    linkText: {
        color: '#3b3b3b',
        fontSize: 14,
        textAlign: 'center',
    },
    linkHighlight: {
        color: '#2e7d32',
        fontWeight: 'bold',
    },
});




// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
// import { Formik } from 'formik';
// import * as Yup from 'yup';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useAuthStore } from '../store/authStore'; // Assuming this path is correct

// const UserDetailSchema = Yup.object().shape({
//     email: Yup.string()
//         .email('Enter a valid email')
//         .required('Email is required'),
//     password: Yup.string()
//         .min(6, 'Password must be at least 6 characters')
//         .required('Password is required'),
// });

// export default function Login({ navigation }) {
//     const [secureText, setSecureText] = useState(true);
//     const login = useAuthStore((state) => state.login);

//     const handleLogin = async (values, { setSubmitting }) => {
//         setSubmitting(true);
//         try {
//             // Update endpoint to the new general login route
//             const res = await axios.post('https://ce1a-62-254-118-133.ngrok-free.app/api/login', values);

//             // Destructure updated fields from the backend response
//             const { token, userRole, user } = res.data; // `user` object is present for login

//             if (!token) {
//                 Alert.alert('Login Failed', 'Login succeeded but no token was returned.');
//                 return;
//             }

//             // Call the login action from your Zustand store with updated data
//             // This will update the `token`, `role`, and `user` state globally.
//             // App.js will then automatically re-render based on these changes.
//             await login({
//                 token,
//                 role: userRole, // Top-level userRole from login response
//                 email: values.email, // Or user.email if you trust the backend's user object more
//                 user: user, // Pass the full user object received from backend
//             });

//             // No manual navigation.replace() here!
//             // App.js handles the navigation based on `token` and `role` state.

//             Alert.alert('Success', 'Logged in successfully!', [{ text: 'OK' }]);

//         } catch (err) {
//             console.error("Login Error:", err.response?.data || err.message);
//             Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password. Please try again.');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
//             <View style={styles.card}>
//                 {/* <Image source={require('../assets/student.jpeg')} style={styles.logo} resizeMode="contain" /> */}

//                 <Text style={styles.title}>FeeHarvest</Text>
//                 <Text style={styles.subtitle}>Your School Fee Management System for Tindiret Educational Centre</Text>

//                 <Formik
//                     initialValues={{ email: '', password: '' }}
//                     validationSchema={UserDetailSchema}
//                     onSubmit={handleLogin}
//                 >
//                     {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
//                         <>
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Email"
//                                 onChangeText={handleChange('email')}
//                                 onBlur={handleBlur('email')}
//                                 value={values.email}
//                                 keyboardType="email-address"
//                                 autoCapitalize="none"
//                             />
//                             {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

//                             <View style={styles.passwordWrapper}>
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Password"
//                                     secureTextEntry={secureText}
//                                     onChangeText={handleChange('password')}
//                                     onBlur={handleBlur('password')}
//                                     value={values.password}
//                                 />
//                                 <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
//                                     <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
//                                 </TouchableOpacity>
//                             </View>
//                             {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

//                             <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
//                                 {isSubmitting ? (
//                                     <ActivityIndicator size="small" color="#ffffff" />
//                                 ) : (
//                                     <Text style={styles.buttonText}>Login</Text>
//                                 )}
//                             </TouchableOpacity>

//                             <TouchableOpacity onPress={() => navigation.navigate('signup')}>
//                                 <Text style={styles.linkText}>Don't have an account? <Text style={styles.loginHighlight}>Create Account</Text></Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')}>
//                                 <Text style={styles.linkText} adjustsFontSizeToFit>Forgot Password?</Text>
//                             </TouchableOpacity>
//                         </>
//                     )}
//                 </Formik>
//             </View>
//         </LinearGradient>
//     );
// }

// const { width } = Dimensions.get('window');

// const styles = StyleSheet.create({
//     gradient: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     card: {
//         width: width * 0.9,
//         backgroundColor: '#ffffff',
//         borderRadius: 20,
//         padding: 24,
//         alignItems: 'center',
//         shadowColor: '#2e7d32',
//         shadowOffset: { width: 0, height: 8 },
//         shadowOpacity: 0.3,
//         shadowRadius: 10,
//         elevation: 10,
//     },
//     title: {
//         fontSize: 28,
//         fontWeight: 'bold',
//         color: '#2e7d32',
//         marginBottom: 5,
//     },
//     subtitle: {
//         fontSize: 14,
//         color: '#4caf50',
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     input: {
//         width: '100%',
//         height: 48,
//         borderColor: '#2e7d32',
//         borderWidth: 1,
//         borderRadius: 10,
//         paddingHorizontal: 12,
//         marginBottom: 12,
//         backgroundColor: '#f9f9f9',
//     },
//     passwordWrapper: {
//         width: '100%',
//         position: 'relative',
//         marginBottom: 12,
//     },
//     eyeIcon: {
//         position: 'absolute',
//         right: 10,
//         top: '25%',
//     },
//     button: {
//         backgroundColor: '#2e7d32',
//         paddingVertical: 14,
//         paddingHorizontal: 20,
//         borderRadius: 10,
//         marginTop: 10,
//         width: '100%',
//         alignItems: 'center',
//     },
//     buttonText: {
//         color: '#ffffff',
//         fontWeight: 'bold',
//         fontSize: 16,
//     },
//     error: {
//         fontSize: 12,
//         color: 'red',
//         marginBottom: 6,
//         alignSelf: 'flex-start',
//     },
//     linkText: {
//         color: '#2e7d32',
//         marginTop: 12,
//         fontSize: 14,
//     },
//     loginHighlight: {
//         color: '#2e7d32',
//         fontWeight: 'bold',
//     },
// });