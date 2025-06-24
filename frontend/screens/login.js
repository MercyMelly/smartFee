// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
// import { Formik } from 'formik';
// import * as Yup from 'yup';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useAuthStore } from '../store/authStore'; 

// const UserDetailSchema = Yup.object().shape({
//   email: Yup.string()
//     .email('Enter a valid email')
//     .required('Email is required'),
//   password: Yup.string()
//     .min(6, 'Password must be at least 6 characters')
//     .required('Password is required'),
// });

// export default function Login({ navigation }) {
//   const [secureText, setSecureText] = useState(true);
//   const login = useAuthStore((state) => state.login);
//   const handleLogin = async (values, { setSubmitting }) => {
//     try {
//       const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/login', values);
//       const { token, role,user } = res.data;

//       if (!token) {
//         Alert.alert('Login Failed', 'Login succeeded but no token was returned.');
//         return;
//       }

//       await login({
//         token,
//         role,
//         email: values.email,
//         user: res.data.user || { email: values.email, role }  
//       });
//       switch (role) {
//         case 'admin':
//           navigation.replace('adminHome');
//           break;
//         case 'bursar':
//           navigation.replace('bursarHome');
//           break;
//         default:
//           Alert.alert('Login Error', 'Unrecognized role. Please contact support.');
//       }
//     } catch (err) {
//       Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
//       <View style={styles.card}>
//         {/* <Image source={require('../assets/student.jpeg')} style={styles.logo} resizeMode="contain" /> */}

//         <Text style={styles.title}>FeeHarvest</Text>
//         <Text style={styles.subtitle}>Your School Fee Management System</Text>

//         <Formik
//           initialValues={{ email: '', password: '' }}
//           validationSchema={UserDetailSchema}
//           onSubmit={handleLogin}
//         >
//           {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
//             <>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Email"
//                 onChangeText={handleChange('email')}
//                 onBlur={handleBlur('email')}
//                 value={values.email}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//               />
//               {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

//               <View style={styles.passwordWrapper}>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Password"
//                   secureTextEntry={secureText}
//                   onChangeText={handleChange('password')}
//                   onBlur={handleBlur('password')}
//                   value={values.password}
//                 />
//                 <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
//                 </TouchableOpacity>
//               </View>
//               {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

//               <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
//                 {isSubmitting ? (
//                   <ActivityIndicator size="small" color="#ffffff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Login</Text>
//                 )}
//               </TouchableOpacity>

//               <TouchableOpacity onPress={() => navigation.navigate('signup')}>
//                 <Text style={styles.linkText}>Don't have an account? Create one</Text>
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')}>
//                 <Text style={styles.linkText}adjustsFontSizeToFit>Forgot Password?</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </Formik>
//       </View>
//     </LinearGradient>
//   );
// }

// const { width } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   gradient: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   card: {
//     width: width * 0.9,
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     padding: 24,
//     alignItems: 'center',
//     shadowColor: '#2e7d32',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2e7d32',
//     marginBottom: 5,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#4caf50',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   input: {
//     width: '100%',
//     height: 48,
//     borderColor: '#2e7d32',
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     marginBottom: 12,
//     backgroundColor: '#f9f9f9',
//   },
//   passwordWrapper: {
//     width: '100%',
//     position: 'relative',
//   },
//   eyeIcon: {
//     position: 'absolute',
//     right: 10,
//     top: 12,
//   },
//   button: {
//     backgroundColor: '#2e7d32',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     marginTop: 10,
//     width: '100%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   error: {
//     fontSize: 12,
//     color: 'red',
//     marginBottom: 6,
//     alignSelf: 'flex-start',
//   },
//   linkText: {
//     color: '#2e7d32',
//     marginTop: 12,
//     fontSize: 14,
//   },
// });



import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore'; // Assuming this path is correct

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
            const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/login', values);

            // Destructure updated fields from the backend response
            const { token, userRole, user } = res.data; // `user` object is present for login

            if (!token) {
                Alert.alert('Login Failed', 'Login succeeded but no token was returned.');
                return;
            }

            // Call the login action from your Zustand store with updated data
            // This will update the `token`, `role`, and `user` state globally.
            // App.js will then automatically re-render based on these changes.
            await login({
                token,
                role: userRole, // Top-level userRole from login response
                email: values.email, // Or user.email if you trust the backend's user object more
                user: user, // Pass the full user object received from backend
            });

            // No manual navigation.replace() here!
            // App.js handles the navigation based on `token` and `role` state.

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

                            <TouchableOpacity onPress={() => navigation.navigate('signup')}>
                                <Text style={styles.linkText}>Don't have an account? <Text style={styles.loginHighlight}>Create Account</Text></Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')}>
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
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#4caf50',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 48,
        borderColor: '#2e7d32',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    passwordWrapper: {
        width: '100%',
        position: 'relative',
        marginBottom: 12,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: '25%',
    },
    button: {
        backgroundColor: '#2e7d32',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    error: {
        fontSize: 12,
        color: 'red',
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    linkText: {
        color: '#2e7d32',
        marginTop: 12,
        fontSize: 14,
    },
    loginHighlight: {
        color: '#2e7d32',
        fontWeight: 'bold',
    },
});