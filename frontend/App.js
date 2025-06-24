import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from './store/authStore';

// Shared Screens
import LandingPage from './screens/landingpage';
import Login from './screens/login';
import Signup from './screens/signup';
import ForgotPassword from './screens/forgotPassword';
import ResetPassword from './screens/resetPassword';

// Admin Screens
import { AdminHome } from './screens/adminHome';
import AddStaffScreen from './adminScreens/addStaff'; // Path check: assuming directly under adminScreens
import AdminAnalyticsScreen from './adminScreens/analyticsScreen'; // <--- NEW IMPORT

// Bursar Screens (These will either be direct tabs or navigatable stack screens)
import BursarTabNavigator from './navigation/bursarTabNavigation';

// Individual Bursar detail/action screens (these will be pushed onto the stack)
import RecordPayment from './bursarScreens/recordPayment';
import NewStudent from './bursarScreens/addStudent';
import StudentProfile from './bursarScreens/studentProfile';
import ProcessProduceScreen from './bursarScreens/produce';


const Stack = createStackNavigator();

export default function App() {
    const [authReady, setAuthReady] = useState(false);
    const { token, role, loadAuth } = useAuthStore();

    useEffect(() => {
        const restoreSession = async () => {
            await loadAuth();
            setAuthReady(true);
        };
        restoreSession();
    }, []);

    if (!authReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2e7d32" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    // --- Public/Auth Stack ---
                    <>
                        <Stack.Screen name="landingpage" component={LandingPage} />
                        <Stack.Screen name="signup" component={Signup} />
                        <Stack.Screen name="login" component={Login} />
                        <Stack.Screen name="forgotPassword" component={ForgotPassword} />
                        <Stack.Screen name="resetPassword" component={ResetPassword} />
                    </>
                ) : role === 'admin' || role === 'director' ? (
                    // --- Admin/Director Stack ---
                    <>
                        <Stack.Screen name="adminHome" component={AdminHome} />
                        <Stack.Screen
                            name="addStaff"
                            component={AddStaffScreen}
                            options={{ headerShown: true, title: 'Add New Staff Member' }}
                        />
                        <Stack.Screen // <--- NEW SCREEN REGISTRATION
                            name="analyticsScreen"
                            component={AdminAnalyticsScreen}
                            options={{ headerShown: false }} // Header handled within the screen itself
                        />
                        {/* Add any other admin-specific detail screens here */}
                    </>
                ) : (
                    // --- Bursar Stack ---
                    <>
                        <Stack.Screen name="BursarTabs" component={BursarTabNavigator} />
                        <Stack.Screen
                            name="recordPayment"
                            component={RecordPayment}
                            options={{ headerShown: true, title: 'Record Payment' }}
                        />
                        <Stack.Screen
                            name="produce"
                            component={ProcessProduceScreen}
                            options={{ headerShown: true, title: 'Process Produce' }}
                        />
                        <Stack.Screen
                            name="addStudent"
                            component={NewStudent}
                            options={{ headerShown: true, title: 'Add New Student' }}
                        />
                        <Stack.Screen
                            name="studentProfile"
                            component={StudentProfile}
                            options={{ headerShown: true, title: 'Student Profile' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
