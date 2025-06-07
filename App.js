import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Landingpage from './screens/landingpage';
import Login from './screens/login'; 
import AdminHome from './screens/adminHome';
import Signup from './screens/signup';
import BursarHome from './screens/bursarHome';
import RecordPayment from './bursarScreens/recordPayment';
import StudentScreen from './bursarScreens/studentsList';
import StudentDetails from './bursarScreens/studentdetails';
import MakePayment from './bursarScreens/makepayment';
import ProcessProduceScreen from './bursarScreens/produce';
import GenerateReceipt from './bursarScreens/generateReceipt';
import PaymentHistory from './bursarScreens/paymentHistory';
import NewStudent from './bursarScreens/addStudent';
import StudentProfile from './bursarScreens/studentProfile';
import StudentList from './bursarScreens/studentsList';
import ForgotPassword from './screens/forgotPassword';
import ResetPassword from './screens/resetPassword';
import SettingsScreen from './screens/settings';
// import LogoutScreen from './screens/logout';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={Landingpage} />
        <Stack.Screen name="signup" component={Signup} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="bursarHome" component={BursarHome} />
        <Stack.Screen name="adminHome" component={AdminHome} />
        <Stack.Screen name="recordPayment" component={RecordPayment} />
        <Stack.Screen name="produce" component={ProcessProduceScreen} />
        <Stack.Screen name="StudentList" component={StudentScreen} />
        <Stack.Screen name="StudentDetails" component={StudentDetails} />
        <Stack.Screen name="makepayment" component={MakePayment} />
        <Stack.Screen name="generateReceipt" component={GenerateReceipt} />
        <Stack.Screen name="paymentHistory" component={PaymentHistory} />
        <Stack.Screen name="addStudent" component={NewStudent} />
        <Stack.Screen name="studentProfile" component={StudentProfile} />
        <Stack.Screen name="studentsList" component={StudentList} />
        <Stack.Screen name="forgotPassword" component={ForgotPassword} />
        <Stack.Screen name="resetPassword" component={ResetPassword} />
        <Stack.Screen name="settings" component={SettingsScreen} />
        {/* <Stack.Screen name="logout" component={LogoutScreen} /> */}
        
      </Stack.Navigator>
    </NavigationContainer>
 );
}