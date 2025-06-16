import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://10.71.114.108:3000/api';

export const AdminHome = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { clearAuth } = useAuthStore(); 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const logout = async () => {
    console.log('User logged out.');
    await clearAuth(); 
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('login');
        },
      },
    ]);
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/dashboard/summary`);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error.message);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (amount) => {
    return `KES ${Number(amount).toLocaleString('en-US')}`;
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#DCEDC8']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#388E3C" />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.greetingTitle}>{getGreeting()}, Admin</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.dashboardTitle}>Overview</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading dashboard data...</Text>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
                <Icon name="account-group" size={30} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>Total Students</Text>
                <Text style={styles.cardValue}>{summary?.totalStudents || 0}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: '#1976D2' }]}>
                <Icon name="currency-usd" size={30} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>Fees Collected</Text>
                <Text style={styles.cardValue}>{formatCurrency(summary?.totalCollected || 0)}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: '#D32F2F' }]}>
                <Icon name="cash-remove" size={30} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>Outstanding Fees</Text>
                <Text style={styles.cardValue}>{formatCurrency(summary?.totalOutstanding || 0)}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: '#F57C00' }]}>
                <Icon name="receipt" size={30} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>Payments Today</Text>
                <Text style={styles.cardValue}>{summary?.paymentsToday || 0}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: '#7B1FA2' }]}>
                <Icon name="alert-decagram" size={30} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>Defaulters</Text>
                <Text style={styles.cardValue}>{summary?.defaultersCount || 0}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    marginLeft: 5,
    color: '#388E3C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#616161',
    marginBottom: 15,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#616161',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  cardIcon: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 5,
  },
  cardValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});