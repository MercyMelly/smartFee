import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const res = await axios.post('http://192.168.0.27:3000/api/login', values); 
      const { token, role } = res.data;
        console.log('Login API response:', res.data);  
      await AsyncStorage.setItem('token', token);
      switch (role) {
        case 'admin':
          navigation.replace('adminHome');
          break;
        case 'bursar':
          navigation.replace('bursarHome');
          break;
        default:
          Alert.alert('Login Error', 'Unrecognized role. Please contact support.');
      }
    } catch (err) {
      console.log('Login error:', err.response?.data || err.message);

      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FeeHarvest</Text>
      <Text style={styles.subtitle} adjustsFontSizeToFit >Your School Fee Management System</Text>
r
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

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={secureText}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
            />
            {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Text style={styles.toggleText} adjustsFontSizeToFit>
                {secureText ? 'Show Password' : 'Hide Password'}
              </Text>
            </TouchableOpacity>
            

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                <Text style={styles.buttonText}>Login</Text>       
                    )}
              </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('signup')}>
              <Text style={styles.linkText}>Don't have an account? Create one</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  logo: {
    width: 200,
    height: 150,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2e7d32'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#4caf50'
  },
  input: {
    height: 48,
    borderColor: '#2e7d32', 
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%'
  },
  toggleText: {
    textAlign: 'right',
    color: '#2e7d32',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    width: '100%',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  error: {
    fontSize: 12,
    color: 'red',
    marginBottom: 6,
  },
  linkText: {
    textAlign: 'center',
    color: '#2e7d32',
    marginTop: 15,
  },
});
