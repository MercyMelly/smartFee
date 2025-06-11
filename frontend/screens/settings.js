import React, { useState } from 'react';
import { View,Text,Switch,TouchableOpacity,StyleSheet,Alert,ScrollView,} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation,useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import BottomNav from '../screens/bottomNav';

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigation = useNavigation();
  const logout = useAuthStore(state => state.logout);
  const route = useRoute();
  const token = route.params?.token || useAuthStore((state) => state.token);

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('login');
        },
      },
    ]);
  };

  const handleResetPassword = () => {
    navigation.navigate('resetPassword');
    // navigation.navigate('resetPassword', { token: 'your-token-here' }); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.optionRow}>
            <View style={styles.rowLeft}>
              <Icon name="theme-light-dark" size={24} color="#2e7d32" />
              <Text style={styles.optionText}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.optionRow} onPress={handleResetPassword}>
            <View style={styles.rowLeft}>
              <Icon name="lock-reset" size={24} color="#2e7d32" />
              <Text style={styles.optionText}>Reset Password</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <Icon name="logout" size={24} color="#e53935" />
              <Text style={[styles.optionText, { color: '#e53935' }]}>Logout</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f5',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
    elevation: 1,
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default SettingsScreen;
