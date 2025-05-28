import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Landingpage from './screens/landingpage';
import Login from './screens/login'; 
import AdminHome from './screens/adminHome';
import Signup from './screens/signup';
import BursarHome from './screens/bursarHome';
import RecordPayment from './bursarScreens/recordPayment';
import StudentScreen from './bursarScreens/studentscreens';
import StudentDetails from './bursarScreens/studentdetails';
import MakePayment from './bursarScreens/makepayment';



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
        <Stack.Screen name="RecordPayment" component={RecordPayment} options={{ title: 'Record Payment' }} />
        <Stack.Screen name="StudentList" component={StudentScreen} />
        <Stack.Screen name="StudentDetails" component={StudentDetails} />
        <Stack.Screen name="makePayment" component={MakePayment} />
      </Stack.Navigator>
    </NavigationContainer>
 );
}