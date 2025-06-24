import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

// IMPORTANT: Replace with your active ngrok HTTPS URL during development,
// or your actual production backend domain.
const BASE_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api'; // Make sure this is updated!

const BursarDashboard = () => {
  const navigation = useNavigation();
  const { token, logout } = useAuthStore();
  // Initialize with correct keys or ensure they are always present
  const [stats, setStats] = useState({ collected: 0, expected: 0, outstanding: 0 });
  const [pendingCount, setPendingCount] = useState(0); // New state for pending count
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStats, setLoadingStats] = useState(true); // New loading state for stats
  const [loadingPending, setLoadingPending] = useState(true); // New loading state for pending count
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh

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

  // Function to fetch fee summary statistics
  const fetchFeeSummary = useCallback(async () => {
    if (!token) {
      console.warn('[BursarHome] No token found for fee summary fetch.');
      setLoadingStats(false);
      return;
    }
    try {
      const config = {
        headers: { 'x-auth-token': token },
        timeout: 15000, // Add timeout for safety
      };
      const response = await axios.get(`${BASE_URL}/dashboard/summary`, config);
      // >>>>>>> FIX HERE: Map backend keys to frontend state keys <<<<<<<
      setStats({
          collected: response.data.totalFeesCollected || 0,
          expected: response.data.totalExpectedFees || 0,
          outstanding: response.data.totalOutstanding || 0,
      });
      console.log("[BursarHome] Fetched Fee Summary Data:", response.data);
    } catch (error) {
      console.error('[BursarHome] Error fetching fee summary:');
      if (error.response) {
          console.error("  Status:", error.response.status);
          console.error("  Data:", error.response.data);
      } else if (error.request) {
          console.error("  No response received. Request:", error.request);
      } else {
          console.error("  Error message:", error.message);
      }
      Alert.alert('Error', error.response?.data?.message || 'Failed to load fee summary.');
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout(); // Logout if unauthorized
      }
    } finally {
      setLoadingStats(false);
    }
  }, [token, logout]);

  // Function to fetch pending payments count
  const fetchPendingCount = useCallback(async () => {
    if (!token) {
      console.warn('[BursarHome] No token found for pending count fetch.');
      setLoadingPending(false);
      return;
    }
    try {
      const config = {
        headers: { 'x-auth-token': token },
        timeout: 15000, // Add timeout for safety
      };
      const response = await axios.get(`${BASE_URL}/webhooks/pending/count`, config);
      setPendingCount(response.data.count);
      console.log("[BursarHome] Fetched Pending Count:", response.data.count);
    } catch (error) {
      console.error('[BursarHome] Error fetching pending payments count:', error.response?.data || error.message);
      // Optionally alert user or handle error display
    } finally {
      setLoadingPending(false);
    }
  }, [token]);


  // Combine fetching for both stats and pending count
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoadingStats(true);
    setLoadingPending(true);
    // Use Promise.allSettled to ensure both complete, even if one fails
    await Promise.allSettled([
      fetchFeeSummary(),
      fetchPendingCount()
    ]);
    setRefreshing(false);
  }, [fetchFeeSummary, fetchPendingCount]);

  // Fetch data when the component mounts and when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Robust formatCurrency function
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      console.warn(`[BursarHome] formatCurrency received non-numeric value: ${amount}`);
      return 'KES 0'; // Fallback for non-numeric input
    }
    return `KES ${numericAmount.toLocaleString('en-US')}`;
  };

  // StatCard component (added defensive rendering)
  const StatCard = ({ icon, title, value, gradientColors, isLoading }) => (
    <LinearGradient colors={gradientColors} style={styles.statCard}>
      <Icon name={icon} size={30} color="#fff" style={styles.statIcon} />
      {isLoading ? ( // Show activity indicator if loading
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.statValue}>{formatCurrency(value)}</Text> // Use formatCurrency
      )}
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
      navigation.navigate('studentProfile', { admissionNumber: searchQuery.trim() });
      setSearchQuery('');
    } else {
      Alert.alert('Search', 'Please enter an admission number to search.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
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

        {/* Fee Summary Section */}
        <Text style={styles.sectionHeader}>Fee Summary</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="cash-multiple"
            title="Collected"
            value={stats.collected} // Now correctly mapped from backend's totalFeesCollected
            gradientColors={['#4CAF50', '#2E7D32']}
            isLoading={loadingStats}
          />
          <StatCard
            icon="bank-check"
            title="Expected"
            value={stats.expected} // Now correctly mapped from backend's totalExpectedFees
            gradientColors={['#2196F3', '#1976D2']}
            isLoading={loadingStats}
          />
          <StatCard
            icon="cash-remove"
            title="Outstanding"
            value={stats.outstanding} // Now correctly mapped from backend's totalOutstanding
            gradientColors={['#FF5722', '#E64A19']}
            isLoading={loadingStats}
          />
        </View>

        {/* Quick Actions Section */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <ActionButton icon="account-plus" label="Add Student" onPress={() => navigation.navigate('addStudent')} />
          <ActionButton icon="cash-plus" label="Record Payment" onPress={() => navigation.navigate('recordPayment')} />
          <ActionButton icon="leaf" label="Value Produce" onPress={() => navigation.navigate('produceValuation')} />
          <ActionButton icon="receipt" label="Generate Receipt" onPress={() => navigation.navigate('generateReceipt')} />
        </View>

        {/* Dynamic Pending Actions Section */}
        <Text style={styles.sectionHeader}>Pending Actions</Text>
        <View style={styles.infoCard}>
          <Icon name="bell-outline" size={28} color="#FFC107" style={{ marginBottom: 10 }} />
          {loadingPending ? (
            <ActivityIndicator size="small" color="#FFC107" style={{ marginBottom: 10 }} />
          ) : (
            <>
              <Text style={styles.infoCardText}>
                You have {pendingCount} payments awaiting confirmation.
              </Text>
              {pendingCount > 0 && (
                <Text style={styles.infoCardTextSmall}>
                  (Review and confirm M-Pesa/Bank payments)
                </Text>
              )}
            </>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('PendingPaymentsTab')} style={styles.infoCardButton}>
            <Text style={styles.infoCardButtonText}>View All Pending</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  infoCardButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  infoCardTextSmall: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default BursarDashboard;
