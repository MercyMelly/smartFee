import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TextInput, // Added for search bar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const BursarDashboard = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({ collected: 0, expected: 0, outstanding: 0 });
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const logout = useAuthStore((state) => state.logout);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  useEffect(() => {
    // In a real app, you'd fetch this data from your backend
    // For now, static data to illustrate the dashboard
    setStats({ collected: 254000, expected: 400000, outstanding: 146000 });
  }, []);

  const StatCard = ({ icon, title, value, gradientColors }) => (
    <LinearGradient colors={gradientColors} style={styles.statCard}>
      <Icon name={icon} size={30} color="#fff" style={styles.statIcon} />
      <Text style={styles.statValue}>KES {value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );

  const ActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.actionGradient}>
        <Icon name={icon} size={35} color="#fff" />
        <Text style={styles.actionText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      // Implement actual search logic here, e.g., navigate to student profile
      navigation.navigate('studentProfile', { admissionNumber: searchQuery.trim() });
      setSearchQuery(''); // Clear search after initiating
    } else {
      Alert.alert('Search', 'Please enter an admission number to search.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>{getGreeting()}, Bursar</Text>
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student by admission number"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Fee Summary Section - Re-introducing as it's crucial */}
        <Text style={styles.sectionHeader}>Fee Summary</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="cash-multiple"
            title="Collected"
            value={stats.collected}
            gradientColors={['#4CAF50', '#2E7D32']} // Green
          />
          <StatCard
            icon="bank-check"
            title="Expected"
            value={stats.expected}
            gradientColors={['#2196F3', '#1976D2']} // Blue
          />
          <StatCard
            icon="cash-remove"
            title="Outstanding"
            value={stats.outstanding}
            gradientColors={['#FF5722', '#E64A19']} // Orange/Red
          />
        </View>

        {/* Quick Actions Section */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <ActionButton icon="account-plus" label="Add Student" onPress={() => navigation.navigate('addStudent')} />
          <ActionButton icon="cash-plus" label="Record Payment" onPress={() => navigation.navigate('recordPayment')} />
          <ActionButton icon="leaf" label="Value Produce" onPress={() => navigation.navigate('produceValuation')} /> {/* Changed route name */}
          <ActionButton icon="receipt" label="Generate Receipt" onPress={() => navigation.navigate('generateReceipt')} />
        </View>

        {/* Placeholder for "Pending Actions" or "Recent Activities" */}
        <Text style={styles.sectionHeader}>Pending Actions</Text>
        <View style={styles.infoCard}>
          <Icon name="bell-outline" size={28} color="#FFC107" style={{ marginBottom: 10 }} />
          <Text style={styles.infoCardText}>
            You have 3 M-Pesa payments awaiting confirmation.
          </Text>
          <Text style={styles.infoCardText}>
            2 Bank transfers need verification.
          </Text>
          {/* FIX: Changed 'pendingPayments' to 'PendingPaymentsTab' */}
          <TouchableOpacity onPress={() => navigation.navigate('PendingPaymentsTab')} style={styles.infoCardButton}>
            <Text style={styles.infoCardButtonText}>View All Pending</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Bottom navigation is now handled by BursarTabNavigator.js */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  greetingText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A5319',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A5319',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  // --- Search Bar Styles ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#1A5319',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // --- Stat Card Styles (Restored) ---
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  // --- Quick Actions Styles ---
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: 15,
    marginTop: 10,
  },
  actionCard: {
    width: '46%',
    aspectRatio: 1,
    margin: '2%',
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionGradient: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  // --- Info Card (for Pending Actions) ---
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoCardText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  infoCardButton: {
    marginTop: 15,
    backgroundColor: '#FFC107', // A warning/attention color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  infoCardButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  // Removed bottomNav styles as it's global
});

export default BursarDashboard;
