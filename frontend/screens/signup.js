import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const UserDetailSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'Full name too short')
    .max(50, 'Full name too long')
    .required('Full name is required'),

  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),

  phoneNumber: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, 'Phone number is not valid')
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

  role: Yup.string()
    .transform(value => value.toLowerCase()) 
    .oneOf(['admin', 'bursar'], 'Role must be admin or bursar')
    .required('Role is required'),
});

export default function Signup({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async (values) => {
    const { fullName, email, phoneNumber, password, role } = values;
    try {
      const userData = {
        fullName,
        email,
        phoneNumber,
        password,
        role,
      };
      const res = await axios.post('http://10.71.114.108:3000/api/signup', userData)
      {console.log(res.data)};
        Alert.alert('User created successfully', 'You can now login with your credentials',[
        {
        text: 'OK',
        onPress: () => navigation.replace('login'), 
      },]);
    } catch (err) {
      console.log("Error:", err.response?.data || err.message);
    } 
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <View style={styles.card}>
         <Image source={require('../assets/student.jpeg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>REGISTER</Text>
        <Formik
          initialValues={{
            fullName: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            role: '',
          }}
          validationSchema={UserDetailSchema}
          onSubmit={handleSignup}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
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

              <TextInput
                style={styles.input}
                placeholder="Role (admin or bursar)"
                onChangeText={handleChange('role')}
                onBlur={handleBlur('role')}
                value={values.role}
              />
              {touched.role && errors.role && <Text style={styles.error}>{errors.role}</Text>}

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                  <Text style={styles.buttonText}adjustsFontSizeToFit>Sign Up</Text>      
                  
                      )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('login')} style={styles.loginLink}>
                  <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}adjustsFontSizeToFit>Login</Text></Text>
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
    fontSize: 28,
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
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f8f4',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
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
