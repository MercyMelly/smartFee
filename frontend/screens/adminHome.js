import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert ,Platform} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For general icons
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

// IMPORTANT: Ensure this IP address is correct and accessible from your device!
// It's crucial that this matches your backend server's IP.
const BASE_URL = 'https://300b-2c0f-fe38-2405-29ac-4d1a-39c4-f7e-d4b8.ngrok-free.app/api'; 

export const AdminHome = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const { logout: clearAuth } = useAuthStore(); // Renamed for clarity, using 'logout' from store

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handleLogout = () => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                    await clearAuth(); // This will clear state and AsyncStorage
                    // App.js handles the navigation back to login automatically because token will be null
                },
            },
        ]);
    };

    const fetchSummary = async () => {
        setLoading(true); // Set loading true at the start of fetch
        try {
            // Get the token from the store for authenticated requests
            const { token } = useAuthStore.getState();
            if (!token) {
                // If token is missing, means user is not authenticated or session expired
                Alert.alert('Authentication Error', 'No token found. Please log in again.');
                clearAuth(); // Clear auth state if token is missing
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, // Send the token with the request
                },
            };

            const res = await axios.get(`${BASE_URL}/dashboard/summary`, config);
            setSummary(res.data);
        } catch (error) {
            console.error('Failed to fetch dashboard summary:', error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.message || 'Failed to load dashboard data. Please try again.');
            // Consider logging out if it's an unauthorized error (e.g., 401, 403)
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: clearAuth } // Automatically navigates due to App.js logic
                ]);
            }
        } finally {
            setLoading(false); // Set loading false after fetch completes (success or error)
        }
    };

    // Use useFocusEffect to refetch data when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchSummary();
            // Optional cleanup function if needed
            return () => {
                // Any cleanup logic when the screen loses focus
            };
        }, []) // Empty dependency array means this effect runs once when mounted and whenever it comes into focus
    );

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
                                <Text style={styles.cardLabel}>Total Fees Collected</Text>
                                {/* Adjusted to match backend dashboardSummary keys */}
                                <Text style={styles.cardValue}>{formatCurrency(summary?.totalFeesCollected || 0)}</Text> 
                            </View>

                            <View style={[styles.card, { backgroundColor: '#D32F2F' }]}>
                                <Icon name="cash-remove" size={30} color="#fff" style={styles.cardIcon} />
                                <Text style={styles.cardLabel}>Outstanding Fees</Text>
                                <Text style={styles.cardValue}>{formatCurrency(summary?.totalOutstanding || 0)}</Text>
                            </View>

                            <View style={[styles.card, { backgroundColor: '#F57C00' }]}>
                                <Icon name="receipt" size={30} color="#fff" style={styles.cardIcon} />
                                <Text style={styles.cardLabel}>Payments Today</Text>
                                {/* Adjusted to match backend dashboardSummary keys */}
                                <Text style={styles.cardValue}>{summary?.numberOfPaymentsToday || 0}</Text> 
                            </View>

                            {/* Using topDefaulters.length for count based on backend response */}
                            <View style={[styles.card, { backgroundColor: '#7B1FA2' }]}>
                                <Icon name="alert-decagram" size={30} color="#fff" style={styles.cardIcon} />
                                <Text style={styles.cardLabel}>Defaulters</Text>
                                {/* Assuming topDefaulters is an array, get its length */}
                                <Text style={styles.cardValue}>{summary?.topDefaulters?.length || 0}</Text> 
                            </View>

                            {/* New Section for Admin Actions */}
                            <View style={styles.actionsSection}>
                                <Text style={styles.actionsTitle}>Admin Actions</Text>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('addStaff')} 
                                >
                                    <Icon name="account-plus-outline" size={24} color="#fff" style={styles.actionButtonIcon} />
                                    <Text style={styles.actionButtonText}>Add New Staff</Text>
                                </TouchableOpacity>
                                {/* Add more admin actions here as needed */}
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
        marginBottom: 30, // Space before new sections
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
    // New styles for Admin Actions section
    actionsSection: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    actionsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 15,
        textAlign: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    actionButton: {
        backgroundColor: '#66BB6A', // A lighter green for action buttons
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonIcon: {
        marginRight: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
