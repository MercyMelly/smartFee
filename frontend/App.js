import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from './store/authStore';

// Public Screens
import LandingPage from './screens/landingpage';
import Login from './screens/login';
import Signup from './screens/signup';
import ForgotPassword from './screens/forgotPassword';
import ResetPassword from './screens/resetPassword';

// Admin Screens
import AdminHome from './screens/adminHome';

// Bursar Screens
import BursarDashboard from './screens/bursarHome';
import RecordPayment from './bursarScreens/recordPayment';
import StudentList from './bursarScreens/studentsList';
import StudentDetails from './bursarScreens/studentdetails';
import MakePayment from './bursarScreens/makepayment';
import ProcessProduceScreen from './bursarScreens/produce';
import GenerateReceipt from './bursarScreens/generateReceipt';
import PaymentHistory from './bursarScreens/paymentHistory';
import NewStudent from './bursarScreens/addStudent';
import StudentProfile from './bursarScreens/studentProfile';
import SettingsScreen from './screens/settings';
import FeeStructure from './bursarScreens/feeStructureScreen';
import StudentFeesLookupScreen from './bursarScreens/feesLook'; 



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
          <>
            <Stack.Screen name="landingpage" component={LandingPage} />
            <Stack.Screen name="signup" component={Signup} />
            <Stack.Screen name="login" component={Login} />
            <Stack.Screen name="forgotPassword" component={ForgotPassword} />
            <Stack.Screen name="resetPassword" component={ResetPassword} />
          </>
        ) : role === 'admin' ? (
          <>
            <Stack.Screen name="adminHome" component={AdminHome} />

          </>
        ) : (
          <>
            <Stack.Screen name="bursarHome" component={BursarDashboard} />
            <Stack.Screen name="recordPayment" component={RecordPayment} />
            <Stack.Screen name="produce" component={ProcessProduceScreen} />
            <Stack.Screen name="studentsList" component={StudentList} />
            <Stack.Screen name="studentdetails" component={StudentDetails} />
            <Stack.Screen name="makepayment" component={MakePayment} />
            <Stack.Screen name="generateReceipt" component={GenerateReceipt} />
            <Stack.Screen name="paymentHistory" component={PaymentHistory} />
            <Stack.Screen name="addStudent" component={NewStudent} />
            <Stack.Screen name="studentProfile" component={StudentProfile} />
            <Stack.Screen name="settings" component={SettingsScreen} />
            <Stack.Screen name="feeStructureScreen" component={FeeStructure} />
            <Stack.Screen name="feesLook" component={StudentFeesLookupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
