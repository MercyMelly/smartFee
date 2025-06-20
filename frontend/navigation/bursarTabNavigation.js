// // navigation/BursarTabNavigator.js
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// // Import Bursar Screens (adjust paths if necessary, based on your project structure)
// import BursarDashboard from '../screens/bursarHome'; // Renamed bursarHome to BursarDashboard for clarity
// import StudentOverview from '../bursarScreens/studentOverview'; // Your Students tab
// import RecordPayment from '../bursarScreens/recordPayment'; // Although it's an action, adding it for now if you want it as a tab
// import ProcessProduceScreen from '../bursarScreens/produce'; // Your Produce tab
// import SettingsScreen from '../screens/settings'; // Shared settings screen
// import FeeStructure from '../bursarScreens/feeStructureScreen'; // Your Fee Structure tab




// const Tab = createBottomTabNavigator();

// const BursarTabNavigator = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         // Hide header for the tab navigator itself.
//         // Individual screens pushed onto the stack from a tab will have their own headers.
//         headerShown: false,
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;
//           let iconColor = focused ? '#1A5319' : '#666'; // Active vs Inactive color

//           // Define icon based on route name
//           if (route.name === 'HomeDashboardTab') {
//             iconName = focused ? 'view-dashboard' : 'view-dashboard-outline'; // Changed to dashboard icon for main home
//           } else if (route.name === 'StudentsTab') {
//             iconName = focused ? 'account-group' : 'account-group-outline';
//           } else if (route.name === 'PaymentsTab') {
//             iconName = focused ? 'cash-multiple' : 'cash-multiple';
//           } else if (route.name === 'ProduceTab') {
//             iconName = focused ? 'sprout' : 'sprout-outline'; // Changed to a more produce-like icon
//           } else if (route.name === 'FeeStructureTab') {
//             iconName = focused ? 'file-tree' : 'file-tree-outline'; // Icon for Fee Structure
//           } else if (route.name === 'SettingsTab') {
//             iconName = focused ? 'cog' : 'cog-outline';
//           }
//           // You can add an AnalyticsTab here if you create a screen for it
//           // else if (route.name === 'AnalyticsTab') {
//           //   iconName = focused ? 'chart-bar' : 'chart-bar-outline';
//           // }

//           return <Icon name={iconName} size={size} color={iconColor} />;
//         },
//         tabBarActiveTintColor: '#1A5319', // Text color for active tab
//         tabBarInactiveTintColor: '#666',   // Text color for inactive tab
//         tabBarStyle: {
//           backgroundColor: '#FFFFFF',
//           borderTopWidth: 1,
//           borderTopColor: '#E0E0E0',
//           height: 60, // Adjust height as needed
//           paddingBottom: 5, // Adjust padding to lift text/icon slightly
//         },
//         tabBarLabelStyle: {
//             fontSize: 11,
//             fontWeight: '600',
//         },
//       })}
//     >
//       {/* Define your Bursar's main tab screens */}
//       <Tab.Screen
//         name="HomeDashboardTab" // Unique name for this tab
//         component={BursarDashboard}
//         options={{ title: 'Dashboard' }} // Label shown on the tab bar
//       />
//       <Tab.Screen
//         name="StudentsTab"
//         component={StudentOverview} // Assuming StudentOverview is your main students screen
//         options={{ title: 'Students' }}
//       />
//       <Tab.Screen
//         name="PaymentsTab"
//         component={RecordPayment} // You mentioned 'payments' as a tab before, but recordPayment is also a key screen. If PaymentsTab is for *listing* payments, then create a new component like 'PaymentHistoryList'. For now, I've put RecordPayment here as a place-holder, but it's usually a detail screen. You might want to make this 'PaymentHistoryList' as the tab and have RecordPayment be a screen you navigate to from there.
//         options={{ title: 'Payments' }}
//       />
//       <Tab.Screen
//         name="ProduceTab"
//         component={ProcessProduceScreen} // Assuming this screen handles produce valuation/listing
//         options={{ title: 'Produce' }}
//       />
//       <Tab.Screen
//         name="FeeStructureTab"
//         component={FeeStructure} // Your Fee Structure screen
//         options={{ title: 'Fees' }} // Using 'Fees' for the tab label for brevity
//       />
//       {/* If you have a specific analytics screen for Bursar, add it here */}
//       {/* <Tab.Screen
//         name="AnalyticsTab"
//         component={BursarAnalyticsScreen}
//         options={{ title: 'Analytics' }}
//       /> */}
//       <Tab.Screen
//         name="SettingsTab"
//         component={SettingsScreen}
//         options={{ title: 'Settings' }}
//       />
//     </Tab.Navigator>
//   );
// };

// export default BursarTabNavigator;

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

// Import your existing screens (ensure these paths are correct)
import BursarDashboard from '../screens/bursarHome';
import StudentOverview from '../bursarScreens/studentOverview';
import RecordPayment from '../bursarScreens/recordPayment';
import ProcessProduceScreen from '../bursarScreens/produce';
import SettingsScreen from '../screens/settings';
import FeeStructure from '../bursarScreens/feeStructureScreen';
import PendingPaymentsScreen from '../bursarScreens/pendingPayments'; // Ensure this path and filename are correct


const Tab = createBottomTabNavigator();

const BursarTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconColor = focused ? '#1A5319' : '#666';

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
          }
          // For MaterialCommunityIcons, return the component
          return <Icon name={iconName} size={size} color={iconColor} />;
        },
        tabBarActiveTintColor: '#1A5319',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
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
      <Tab.Screen // Ensure no whitespace/comments directly above or below this
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
