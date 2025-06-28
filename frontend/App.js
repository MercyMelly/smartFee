import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StatusBar, Text } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from './store/authStore';
import axios from 'axios';

// Shared Screens
import LandingPage from './screens/landingpage';
import Login from './screens/login';
import Signup from './screens/signup';
import ForgotPassword from './screens/forgotPassword';
import ResetPassword from './screens/resetPassword';

// Parent Screens
import ParentDashboard from './screens/parentsHome'; 
import ParentSignupScreen from './screens/parentsSignup'; 
import PayFeesScreen from './parentScreens/payFees';
import PaymentWebViewScreen from './parentScreens/paystack'; 
import PaymentSuccessScreen from './parentScreens/paySuccess'; 

// Admin Screens
import { AdminHome } from './screens/adminHome'; 
import AddStaffScreen from './adminScreens/addStaff';
import AdminAnalyticsScreen from './adminScreens/analyticsScreen';

// Bursar Screens and Navigator
import BursarTabNavigator from './navigation/bursarTabNavigation';
import RecordPayment from './bursarScreens/recordPayment';
import NewStudent from './bursarScreens/addStudent';
import ProcessProduce from './bursarScreens/produce'; 
import StudentOverview from './bursarScreens/studentOverview';
import BulkSmsScreen from './bursarScreens/bulkSms';
// No need to import PendingPaymentsScreen directly here if it's only used within BursarTabNavigator
// import PendingPaymentsScreen from './bursarScreens/pendingPayments'; 

const Stack = createStackNavigator();

export default function App() {
    const { token, role, isLoading, loadAuth, logout } = useAuthStore(); 

    useEffect(() => {
        loadAuth(); 
    }, [loadAuth]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            delete axios.defaults.headers.common['Authorization']; 
            console.log('[App.js] Axios default x-auth-token set.');
        } else {
            delete axios.defaults.headers.common['x-auth-token'];
            delete axios.defaults.headers.common['Authorization']; 
            console.log('[App.js] Axios default x-auth-token removed.');
        }
    }, [token]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f5e9' }}>
                <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={{ marginTop: 10, fontSize: 16, color: '#2e7d32' }}>Loading authentication...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    // Screens for unauthenticated users
                    <>
                        <Stack.Screen name="landingpage" component={LandingPage} />
                        <Stack.Screen name="signup" component={Signup} />
                        <Stack.Screen name="login" component={Login} />
                        <Stack.Screen name="forgotPassword" component={ForgotPassword} />
                        <Stack.Screen name="resetPassword" component={ResetPassword} />
                        <Stack.Screen name="ParentSignup" component={ParentSignupScreen} />
                        {/* If any of these lead to bursar-only screens, they should be authenticated */}
                        {/* For now, removing the problematic pendingPayments screen from here */}
                        {/* <Stack.Screen name="pendingPayments" component={PendingPaymentsScreen} /> */}
                    </>
                ) : role === 'admin' || role === 'director' ? (
                    // Screens for Admin/Director roles
                    <>
                        <Stack.Screen name="adminHome" component={AdminHome} />
                        <Stack.Screen
                            name="addStaff"
                            component={AddStaffScreen}
                            options={{ headerShown: true, title: 'Add New Staff Member' }}
                        />
                        <Stack.Screen
                            name="analyticsScreen"
                            component={AdminAnalyticsScreen}
                            options={{ headerShown: false }} 
                        />
                        {/* If Admin/Director should also access PendingPaymentsScreen, add it here and import it at top */}
                        {/* Example: <Stack.Screen name="pendingPayments" component={PendingPaymentsScreen} options={{ headerShown: true, title: 'Pending Payments' }} /> */}
                    </>
                ) : role === 'parent' ? (
                    // Screens for Parent role
                    <>
                        <Stack.Screen name="parentsHome" component={ParentDashboard} />
                        <Stack.Screen
                            name="payFees"
                            component={PayFeesScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="paystack"
                            component={PaymentWebViewScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="paySuccess" 
                            component={PaymentSuccessScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                ) : ( // Default to Bursar role if authenticated and not admin/director/parent
                    // Screens for Bursar role
                    <>
                        <Stack.Screen name="BursarTabs" component={BursarTabNavigator} />
                        <Stack.Screen
                            name="recordPayment"
                            component={RecordPayment}
                            options={{ headerShown: true, title: 'Record Payment' }}
                        />
                        <Stack.Screen
                            name="bulkSms" 
                            component={BulkSmsScreen}
                            options={{ headerShown: true, title: 'Bulk SMS' }}
                        />
                        <Stack.Screen
                            name="addStudent"
                            component={NewStudent}
                            options={{ headerShown: true, title: 'Add New Student' }}
                        />
                        <Stack.Screen
                            name="studentOverview"
                            component={StudentOverview}
                            options={{ headerShown: true, title: 'Student Overview' }}
                        />
                        <Stack.Screen
                            name="produce" 
                            component={ProcessProduce}
                            options={{ headerShown: true, title: 'Process Produce' }}
                        />
                        {/* REMOVED: This screen is already defined within BursarTabNavigator */}
                        {/* <Stack.Screen 
                            name="pendingPayments" 
                            component={PendingPaymentsScreen} 
                            options={{ headerShown: true, title: 'Pending Payments' }} 
                        /> */}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
