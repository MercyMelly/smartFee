import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BursarDashboard = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({ collected: 0, expected: 0, outstanding: 0 });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    // Later, fetch from backend
    setStats({ collected: 254000, expected: 400000, outstanding: 146000 });
  }, []);

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Icon name={icon} size={30} color="#fff" />
      <Text style={styles.statValue}>KES {value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const ActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Icon name={icon} size={30} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.title}>{getGreeting()}, Bursar</Text>
        <Text style={styles.subTitle}>{new Date().toDateString()}</Text>

        <Text style={styles.sectionHeader}>📊 Financial Summary</Text>
        <View style={styles.statsRow}>
          <StatCard icon="cash" title="Collected" value={stats.collected} color="#4caf50" />
          <StatCard icon="chart-line" title="Expected" value={stats.expected} color="#2196f3" />
        </View>
        <StatCard icon="alert-circle" title="Outstanding" value={stats.outstanding} color="#f44336" />

        <Text style={styles.sectionHeader}>🎯 Quick Actions</Text>
        <View style={styles.quickActions}>
          <ActionButton icon="account-plus" label="Add Student" onPress={() => navigation.navigate('addStudent')} />
          <ActionButton icon="cash-plus" label="Record Payment" onPress={() => navigation.navigate('recordPayment')} />
          <ActionButton icon="leaf" label="Value Produce" onPress={() => navigation.navigate('produce')} />
          <ActionButton icon="file-document" label="Receipt" onPress={() => navigation.navigate('generateReceipt')} />
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Icon name="view-dashboard" size={28} color="#2e7d32" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('studentsList')}>
          <Icon name="account-group" size={28} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('payments')}>
          <Icon name="cash" size={28} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('produce')}>
          <Icon name="scale-balance" size={28} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('settings')}>
          <Icon name="cog-outline" size={28} color="#777" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 20,
    color: '#2e7d32',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    marginHorizontal: 15,
    marginBottom: 10,
    color: '#777',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
  },
  statCard: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  statValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  actionCard: {
    backgroundColor: '#2e7d32',
    width: '45%',
    padding: 15,
    margin: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default BursarDashboard;
