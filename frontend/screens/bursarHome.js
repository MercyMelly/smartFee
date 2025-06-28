import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/index'; 

const BursarDashboard = () => {
    const navigation = useNavigation();
    const { token, logout, user } = useAuthStore();
    const [stats, setStats] = useState({ collected: 0, expected: 0, outstanding: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handleLogout = useCallback(() => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                },
            },
        ]);
    }, [logout]);

    const fetchFeeSummary = useCallback(async () => {
        if (!token) {
            setLoadingStats(false);
            setRefreshing(false);
            return;
        }
        try {
            const config = {
                headers: { 'x-auth-token': token },
            };
            const response = await axios.get(`${BASE_URL}/dashboard/summary`, config);
            setStats({
                collected: response.data.totalFeesCollected || 0,
                expected: response.data.totalExpectedFees || 0,
                outstanding: response.data.totalOutstanding || 0,
            });
        } catch (error) {
            console.error('Error fetching fee summary:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to load fee summary. Please check your network and server.');
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        } finally {
            setLoadingStats(false);
            setRefreshing(false);
        }
    }, [token, logout]);

    useFocusEffect(
        useCallback(() => {
            setLoadingStats(true);
            fetchFeeSummary();
        }, [fetchFeeSummary])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFeeSummary();
    }, [fetchFeeSummary]);

    const StatCard = ({ icon, title, value, gradientColors }) => (
        <LinearGradient colors={gradientColors} style={styles.statCard}>
            <Icon name={icon} size={30} color="#fff" style={styles.statIcon} />
            {loadingStats ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text style={styles.statValue}>KES {(value || 0).toLocaleString()}</Text>
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
            navigation.navigate('studentOverview', { admissionNumber: searchQuery.trim() });
            setSearchQuery('');
        } else {
            Alert.alert('Search', 'Please enter an admission number to search.');
        }
    };

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                    }
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.topBar}>
                            {/* Logo */}
                            <View style={styles.logoContainer}>
                                <Ionicons name="school" size={30} color="#1B5E20" />
                                <Text style={styles.logoText}>Tindiret Educational Centre</Text>
                            </View>
                            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                <Icon name="logout" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.greetingText}>{getGreeting()}, {user?.fullName || 'Bursar'}</Text>
                        <Text style={styles.dateText}>{new Date().toDateString()}</Text>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search student by admission number"
                            placeholderTextColor="#757575"
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
                            value={stats.collected}
                            gradientColors={['#4CAF50', '#2E7D32']}
                        />
                        <StatCard
                            icon="bank-check"
                            title="Expected"
                            value={stats.expected}
                            gradientColors={['#2196F3', '#1976D2']}
                        />
                        <StatCard
                            icon="cash-remove"
                            title="Outstanding"
                            value={stats.outstanding}
                            gradientColors={['#FF5722', '#E64A19']}
                        />
                    </View>

                    {/* Quick Actions Section */}
                    <Text style={styles.sectionHeader}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <ActionButton icon="account-plus" label="Add Student" onPress={() => navigation.navigate('addStudent')} />
                        <ActionButton icon="cash-plus" label="Record Payment" onPress={() => navigation.navigate('recordPayment')} />
                        {/* Removed Fee Structure Button as requested */}
                        <ActionButton icon="alert-circle" label="Pending Payments" onPress={() => navigation.navigate('PendingPaymentsTab')} />
                        {/* Changed 'Value Produce' to 'Bulk SMS' */}
                        <ActionButton icon="message-text-outline" label="Bulk SMS" onPress={() => navigation.navigate('bulkSms')} />
                    </View>
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
        paddingBottom: 20,
    },
    headerContainer: {
        paddingHorizontal: 0,
        paddingTop: 20,
        backgroundColor: '#F0F8F6',
        paddingBottom: 15,
        borderRadius: 15,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginLeft: 8,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 5,
        paddingHorizontal: 20,
    },
    dateText: {
        fontSize: 14,
        color: '#616161',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    logoutButton: {
        padding: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 20,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A5319',
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
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 10,
    },
    statCard: {
        width: '30%',
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
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    statTitle: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '500',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Ensures even spacing
        marginTop: 10,
        gap: 10, // Provides consistent spacing between items
    },
    actionCard: {
        width: '48%', // Adjusted width for 2 columns, considering gap
        aspectRatio: 1.2,
        borderRadius: 15,
        overflow: 'hidden',
        // Removed explicit margins as `gap` handles spacing now
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
});

export default BursarDashboard;
