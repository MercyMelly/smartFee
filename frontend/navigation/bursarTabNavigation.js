import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

// Import your existing screens (ensure these paths are correct and they are DEFAULT EXPORTS)
import BursarDashboard from '../screens/bursarHome';
import StudentOverview from '../bursarScreens/studentOverview';
import RecordPayment from '../bursarScreens/recordPayment';
import ProcessProduceScreen from '../bursarScreens/produce';
import SettingsScreen from '../screens/settings';
import FeeStructure from '../bursarScreens/feeStructureScreen';
import PendingPaymentsScreen from '../bursarScreens/pendingPayments'; // <-- IMPORTANT: Ensure this is a DEFAULT export from its file


const Tab = createBottomTabNavigator();

const BursarTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconColor = focused ? '#1A5319' : '#666'; // Dark green for active, grey for inactive

          if (route.name === 'HomeDashboardTab') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'StudentsTab') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'PaymentsTab') {
            iconName = focused ? 'cash-multiple' : 'cash-multiple';
          } else if (route.name === 'FeeStructureTab') {
            iconName = focused ? 'file-tree' : 'file-tree-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'cog' : 'cog-outline';
          } else if (route.name === 'PendingPaymentsTab') {
            // For Ionicons, return the component directly
            return <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={size} color={iconColor} />;
          } else if (route.name === 'ProduceTab') { // Also handle produce tab icon
            iconName = focused ? 'fruit-pineapple' : 'fruit-pineapple-outline'; // Example icon for produce
          }

          // For MaterialCommunityIcons, return the component
          return <Icon name={iconName} size={size} color={iconColor} />;
        },
        tabBarActiveTintColor: '#1A5319', // Active tab label color
        tabBarInactiveTintColor: '#666', // Inactive tab label color
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // Tab bar background color
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="HomeDashboardTab"
        component={BursarDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="StudentsTab"
        component={StudentOverview}
        options={{ title: 'Students' }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={RecordPayment}
        options={{ title: 'Payments' }}
      />
      <Tab.Screen 
        name="PendingPaymentsTab"
        component={PendingPaymentsScreen}
        options={{ title: 'Pending' }}
      />
      <Tab.Screen
        name="ProduceTab"
        component={ProcessProduceScreen}
        options={{ title: 'Produce' }}
      />
      <Tab.Screen
        name="FeeStructureTab"
        component={FeeStructure}
        options={{ title: 'Fees' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default BursarTabNavigator;
