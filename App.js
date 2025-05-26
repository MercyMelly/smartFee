import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Landingpage from './screens/landingpage';
import Login from './screens/login'; 
import AdminHome from './screens/adminHome';
import Signup from './screens/signup';
import BursarHome from './screens/bursarHome';
import RecordPayment from './bursarScreens/recordPayment';
import ProcessProduce from './bursarScreens/produce';
import GenerateReceipt from './bursarScreens/generateReceipt';

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
        <Stack.Screen name="ProcessProduce" component={ProcessProduce} options={{ title: 'Process Produce' }} />
        <Stack.Screen name="GenerateReceipt" component={GenerateReceipt} options={{ title: 'Generate Receipt' }} />
      </Stack.Navigator>
    </NavigationContainer>
 );
}