// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, View } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuthStore } from './store/authStore';

// // Shared Screens
// import LandingPage from './screens/landingpage';
// import Login from './screens/login';
// import Signup from './screens/signup';
// import ForgotPassword from './screens/forgotPassword';
// import ResetPassword from './screens/resetPassword';

// // Admin Screens
// import {AdminHome} from './screens/adminHome';


// // Bursar Screens
// import BursarDashboard from './screens/bursarHome';
// import RecordPayment from './bursarScreens/recordPayment';
// import StudentList from './bursarScreens/studentsList';
// import ProcessProduceScreen from './bursarScreens/produce';
// import NewStudent from './bursarScreens/addStudent';
// import StudentProfile from './bursarScreens/studentProfile';
// import SettingsScreen from './screens/settings';
// import FeeStructure from './bursarScreens/feeStructureScreen';
// import StudentProfileScreen from './bursarScreens/feesLook'; 


// const Stack = createStackNavigator();

// export default function App() {
//   const [authReady, setAuthReady] = useState(false);
//   const { token, role, loadAuth } = useAuthStore();

//   useEffect(() => {
//     const restoreSession = async () => {
//       await loadAuth();
//       setAuthReady(true);
//     };
//     restoreSession();
//   }, []);

//   if (!authReady) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#2e7d32" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {!token ? (
//           <>
//             <Stack.Screen name="landingpage" component={LandingPage} />
//             <Stack.Screen name="signup" component={Signup} />
//             <Stack.Screen name="login" component={Login} />
//             <Stack.Screen name="forgotPassword" component={ForgotPassword} />
//             <Stack.Screen name="resetPassword" component={ResetPassword} />
//           </>
//         ) : role === 'admin' ? (
//           <>
//             <Stack.Screen name="adminHome" component={AdminHome} />

//           </>
//         ) : (
//           <>
//             <Stack.Screen name="bursarHome" component={BursarDashboard} />
//             <Stack.Screen name="recordPayment" component={RecordPayment} />
//             <Stack.Screen name="produce" component={ProcessProduceScreen} />
//             <Stack.Screen name="studentsList" component={StudentList} />
//             <Stack.Screen name="addStudent" component={NewStudent} />
//             <Stack.Screen name="studentProfile" component={StudentProfile} />
//             <Stack.Screen name="settings" component={SettingsScreen} />
//             <Stack.Screen name="feeStructureScreen" component={FeeStructure} />
//             <Stack.Screen name="feesLook" component={StudentProfileScreen} />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

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
// import SettingsScreen from './screens/settings'; // Not directly used here, but in BursarTabs

// Admin Screens
import { AdminHome } from './screens/adminHome'; // AdminHome is imported without curly braces in original App.js
import AddStaffScreen from './adminScreens/addStaff'; // Corrected path to frontend/adminScreens/addStaff.js

// Bursar Screens (These will either be direct tabs or navigatable stack screens)
import BursarTabNavigator from './navigation/bursarTabNavigation'; // Import the new Bursar Tab Navigator

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
                ) : role === 'admin' || role === 'director' ? ( // <--- THE FIX IS HERE! Now checks for 'admin' OR 'director'
                    // --- Admin/Director Stack ---
                    <>
                        {/* For Admin/Director, you'd likely create an AdminTabNavigator similar to Bursar's in the future */}
                        <Stack.Screen name="adminHome" component={AdminHome} />
                        <Stack.Screen
                            name="addStaff"
                            component={AddStaffScreen}
                            options={{ headerShown: true, title: 'Add New Staff Member' }}
                        />
                        {/* Add any other admin-specific detail screens here that are pushed from AdminHome */}
                    </>
                ) : ( // If the role is neither 'admin' nor 'director', it's treated as bursar by default
                    // --- Bursar Stack ---
                    <>
                        <Stack.Screen name="BursarTabs" component={BursarTabNavigator} />

                        {/* These are individual screens that will be pushed on top of the tabs.
                            They will automatically get a back button because they are in a Stack.Navigator
                            and headerShown is true for them. */}
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