import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
      // Updated endpoint for sending OTP
      const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/password/send-otp', { email });
      Alert.alert('OTP Sent', res.data.message || 'Please check your email for the OTP.');
      setStep(2); // Move to OTP verification step
  } catch (err) {
      console.log("Send OTP Error:", err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Could not send OTP. Please try again.');
  } finally {
      setLoading(false);
  }
};

const handleVerifyOtp = async () => {
  if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
  }
  setLoading(true);
  try {
      // Updated endpoint for verifying OTP
      const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/password/verify-otp', { email, otp });
      const { token } = res.data;
      // The token received here is a temporary reset token, not a full login token.
      // We'll pass it to the resetPassword screen.
      Alert.alert('OTP Verified', 'You can now set your new password.');
      setStep(3); // Move to password reset step
      // We store the resetToken temporarily in state, or pass it via navigation params
      // For simplicity, let's keep it in a ref or local state if navigation directly to ResetPassword
      // is not done, but here we just transition step.
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
      // You'll need the token from the previous verify-otp step here.
      // Since we're keeping it on the same screen, we need to ensure the token from handleVerifyOtp
      // is accessible. For simplicity in a single screen flow, the backend's /verify-otp
      // should not give a token for client-side storage unless it's explicitly for this
      // screen to then send.
      // A safer approach might be: /verify-otp makes a backend call, then /reset-password
      // is called with the same email/OTP, or the token is stored locally for this step.
      // Given the current backend '/reset-password' expects 'token' in body, we need to adapt.

      // To streamline, let's assume `handleVerifyOtp` implicitly sets up something in the session
      // or we rethink the token flow. For now, let's make a direct call using email/otp.
      // The backend's /reset-password expects a token. So the frontend needs to get that token.
      // The simplest way to handle this on one screen is:
      // 1. send-otp (returns success)
      // 2. verify-otp (returns a temporary reset token)
      // 3. reset-password (sends the temporary token and new password)

      // Let's modify handleVerifyOtp to store the token:
      // const [resetToken, setResetToken] = useState(null); // Add this state
      // In handleVerifyOtp: setResetToken(token);

      // For now, let's send email and otp again to /reset-password (less secure, but quick fix based on your current setup)
      // OR if you navigate, pass token as param. Since you want it on one screen, we need a way to pass the token.

      // Let's adjust handleVerifyOtp to pass the token via navigation or store it better.
      // Simplest for now: The backend /verify-otp returns a token, you need to save it.
      // Re-evaluating your backend /verify-otp:
      // `res.json({ status: 'ok', token, role: user.role });` -> this token *is* the reset token.
      // So, in `handleVerifyOtp`, save it to a state variable.

      const tempResetToken = await AsyncStorage.getItem('tempResetToken'); // Assuming you save it here in handleVerifyOtp

      // If we are on one screen and step 3 is reached, the token from verifyOtp should be accessible.
      // Let's refine `handleVerifyOtp` to store it so `handleResetPassword` can use it.
      // I'll add `const [resetToken, setResetToken] = useState(null);` to the component state.

      const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/password/reset-password', {
          token: tempResetToken, // Use the token obtained from verifyOtp
          newPassword: newPassword,
      });

      Alert.alert('Password Reset', res.data.message || 'Your password has been successfully reset. You can now login.');
      navigation.replace('login'); // Navigate back to login
  } catch (err) {
      console.log("Reset Password Error:", err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Could not reset password. Please try again or request a new OTP.');
  } finally {
      setLoading(false);
  }
};

// To make the reset token available to handleResetPassword, let's refine handleVerifyOtp:
const handleVerifyOtpAndPrepareReset = async () => {
  if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
  }
  setLoading(true);
  try {
      const res = await axios.post('https://d25e-62-254-118-133.ngrok-free.app/api/password/verify-otp', { email, otp });
      const { token: receivedResetToken } = res.data; // Rename to avoid conflict with `token` from context
      
      // Store the reset token in AsyncStorage temporarily or component state
      await AsyncStorage.setItem('tempResetToken', receivedResetToken); // Saving it to AsyncStorage

      Alert.alert('OTP Verified', 'You can now set your new password.');
      setStep(3); // Move to password reset step
  } catch (err) {
      console.log("Verify OTP Error:", err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
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
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('login')} style={styles.linkText}>
                      <Text style={styles.linkText}>Back to Login</Text>
                  </TouchableOpacity>
              </>
          )}

          {step === 2 && (
              <>
                  <TextInput
                      style={styles.input}
                      placeholder="Enter OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.button} onPress={handleVerifyOtpAndPrepareReset} disabled={loading}> {/* Use the updated function */}
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep(1)}>
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
                          secureTextEntry={!showNewPassword}
                          onChangeText={setNewPassword}
                          value={newPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                          <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                      </TouchableOpacity>
                  </View>
                  <View style={styles.passwordContainer}>
                      <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]} // Adjust marginBottom for input in container
                          placeholder="Confirm New Password"
                          secureTextEntry={!showConfirmNewPassword}
                          onChangeText={setConfirmNewPassword}
                          value={confirmNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                          <Ionicons name={showConfirmNewPassword ? 'eye-off' : 'eye'} size={24} color="#2e7d32" />
                      </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep(1)}>
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
  borderColor: '#2e7d32',
  borderRadius: 8,
  paddingHorizontal: 12,
  marginBottom: 15, // Default margin for inputs
  backgroundColor: '#f1f8f4',
},
passwordContainer: { // Style for the container wrapping password input and eye icon
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  borderWidth: 1,
  borderColor: '#2e7d32',
  borderRadius: 8,
  paddingRight: 12, // Space for eye icon
  marginBottom: 15, // Match input marginBottom
  backgroundColor: '#f1f8f4',
},
button: {
  backgroundColor: '#2e7d32',
  padding: 15,
  borderRadius: 8,
  width: '100%',
  alignItems: 'center',
  marginTop: 10,
},
buttonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
linkText: {
  marginTop: 15,
  color: '#2e7d32',
},
});