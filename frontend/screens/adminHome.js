import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
    RefreshControl,
    Dimensions
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { PieChart, BarChart } from 'react-native-chart-kit'; // Import BarChart as well

// IMPORTANT: Ensure this BASE_URL matches your backend server's IP/ngrok URL!
const BASE_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api';

const screenWidth = Dimensions.get('window').width;

// Consolidated Chart configuration for better aesthetics and green theme
const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(16, 104, 28, ${opacity})`, // Dark green for labels/lines
    labelColor: (opacity = 1) => `rgba(16, 104, 28, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.8, // Make bars a bit wider
    useShadowColorFromDataset: false,
    propsForLabels: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    decimalPlaces: 0, // No decimal places for values
    propsForVerticalLabels: { // Added for bar chart vertical labels
        fontSize: 10,
    },
    propsForHorizontalLabels: { // Added for bar chart horizontal labels
        fontSize: 10,
    },
    fillShadowGradient: '#4CAF50', // Default fill for bars/areas
    fillShadowGradientOpacity: 0.8,
};

export const AdminHome = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const { token, logout: clearAuth } = useAuthStore();

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
                    await clearAuth();
                },
            },
        ]);
    };

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        if (!token) {
            console.warn('[AdminHome] No token found during fetchSummary. User might not be logged in.');
            Alert.alert('Authentication Error', 'No token found. Please log in again.');
            clearAuth();
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const { token: currentToken } = useAuthStore.getState();
            const config = {
                headers: { 'x-auth-token': currentToken },
                timeout: 15000,
            };
            const res = await axios.get(`${BASE_URL}/dashboard/summary`, config);
            console.log("[AdminHome] Fetched Summary Data:", res.data);
            setSummary(res.data);
        } catch (error) {
            console.error('[AdminHome] Failed to fetch dashboard summary:');
            if (error.response) {
                console.error("  Status:", error.response.status);
                console.error("  Data:", error.response.data);
                console.error("  Headers:", error.response.headers);
                Alert.alert('Error', error.response.data?.message || `Server responded with status ${error.response.status}.`);
                if (error.response.status === 401 || error.response.status === 403) {
                    Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                        { text: 'OK', onPress: clearAuth }
                    ]);
                }
            } else if (error.request) {
                console.error("  No response received. Request:", error.request);
                Alert.alert('Error', 'No response from server. Please check your network connection and backend server status.');
            } else {
                console.error("  Error message:", error.message);
                if (axios.isCancel(error)) {
                    console.error('  Request canceled:', error.message);
                } else if (error.code === 'ECONNABORTED') {
                    Alert.alert('Error', 'Request timed out. The server is taking too long to respond.');
                } else {
                    Alert.alert('Error', `An unexpected error occurred: ${error.message}.`);
                }
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [clearAuth]);

    useFocusEffect(
        useCallback(() => {
            fetchSummary();
        }, [fetchSummary])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSummary();
    }, [fetchSummary]);

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            console.warn(`[AdminHome] formatCurrency received non-numeric value: ${amount}`);
            return 'KES 0';
        }
        return `KES ${numericAmount.toLocaleString('en-US')}`;
    };

    // Reusable ActionCard component with enhanced styling
    const ActionCard = ({ icon, title, onPress, gradientColors }) => (
        <TouchableOpacity style={styles.actionCardButton} onPress={onPress}>
            <LinearGradient colors={gradientColors} style={styles.actionCardGradient}>
                <Icon name={icon} size={40} color="#FFFFFF" />
                <Text style={styles.actionCardText}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    // Prepare data for Pie Chart for financial status breakdown
    const pieChartDataFinancialStatus = summary ? [] : [];

    if (summary) {
        const totalCollected = summary.totalFeesCollected || 0;
        const totalOutstanding = summary.totalOutstanding || 0;

        // Collected
        if (totalCollected > 0) { // Only add if positive
            pieChartDataFinancialStatus.push({
                name: 'Total Collected',
                value: totalCollected,
                color: '#4CAF50', // Vibrant Green
                legendFontColor: '#333',
                legendFontSize: 14,
            });
        }

        // Outstanding (if positive)
        if (totalOutstanding > 0) { // Only add if positive
            pieChartDataFinancialStatus.push({
                name: 'Total Outstanding',
                value: totalOutstanding,
                color: '#D32F2F', // Deep Red
                legendFontColor: '#333',
                legendFontSize: 14,
            });
        }
        // Overpaid (if outstanding is negative)
        else if (totalOutstanding < 0) {
            pieChartDataFinancialStatus.push({
                name: 'Total Overpaid',
                value: Math.abs(totalOutstanding), // Absolute value for pie chart
                color: '#2196F3', // Blue for overpaid
                legendFontColor: '#333',
                legendFontSize: 14,
            });
        }
    }


    // Prepare data for Bar Chart: Fees by Grade (adapted from analytics screen)
    const barChartDataFeesByGrade = summary && summary.feesByGrade && summary.feesByGrade.length > 0 ? {
        labels: summary.feesByGrade.map(item => item._id || 'N/A'), // Grade levels
        datasets: [
            {
                data: summary.feesByGrade.map(item => item.totalExpectedForGrade || 0),
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for expected
                label: 'Expected',
            },
            {
                data: summary.feesByGrade.map(item => item.totalCollectedForGrade || 0),
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for collected
                label: 'Collected',
            }
        ]
    } : { labels: [], datasets: [] };


    return (
        <LinearGradient colors={['#F0F4F7', '#E8F0F3']} style={styles.gradientBackground}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} tintColor="#1B5E20" />
                    }
                >
                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        <Icon name="school-outline" size={38} color="#1A5319" />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.greetingText}>{getGreeting()}, Admin!</Text>
                            <Text style={styles.currentDateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        </View>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Icon name="logout-variant" size={22} color="#388E3C" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#1B5E20" />
                            <Text style={styles.loadingText}>Loading dashboard data...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Prominent Total Expected Fees Display */}
                            <View style={styles.totalExpectedCard}>
                                <Text style={styles.totalExpectedLabel}>Total Expected Fees</Text>
                                <Text style={styles.totalExpectedValue}>{formatCurrency(summary?.totalExpectedFees)}</Text>
                                <Text style={styles.totalExpectedHint}>
                                    (This figure is based on student fee assignments in your backend.)
                                </Text>
                            </View>

                            {/* Overall Fee Status Pie Chart */}
                            <Text style={styles.sectionTitle}>Financial Summary</Text>
                            {pieChartDataFinancialStatus.length > 0 ? (
                                <View style={styles.chartCard}>
                                    <PieChart
                                        data={pieChartDataFinancialStatus}
                                        width={screenWidth - 60} // Adjusted for better internal padding
                                        height={200} // Slightly smaller height
                                        chartConfig={chartConfig}
                                        accessor="value"
                                        backgroundColor="transparent"
                                        paddingLeft="15"
                                        center={[screenWidth / 2.5 - 20, 0]} // Keep this for now, can adjust further
                                        absolute
                                        has />
                                    <View style={styles.legendContainer}>
                                        {pieChartDataFinancialStatus.map((item, index) => (
                                            <View key={index} style={styles.legendItem}>
                                                <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                                                <Text style={styles.legendText}>
                                                    {item.name}: {formatCurrency(item.value)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.noDataCard}>
                                    <Text style={styles.noDataText}>No collected or outstanding fee data for pie chart.</Text>
                                </View>
                            )}

                            {/* Fees by Grade Level Bar Chart */}
                            <Text style={styles.sectionTitle}>Fees by Grade Level</Text>
                            {summary && barChartDataFeesByGrade.labels.length > 0 ? (
                                <View style={styles.chartCard}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <BarChart
                                            data={barChartDataFeesByGrade}
                                            width={Math.max(screenWidth - 60, summary.feesByGrade.length * 80)} // Dynamic width for horizontal scroll
                                            height={250}
                                            chartConfig={chartConfig}
                                            verticalLabelRotation={30}
                                            showBarTops={true}
                                            showValuesOnTopOfBars={true}
                                            fromZero={true}
                                            style={{ marginVertical: 8, borderRadius: 16 }}
                                        />
                                    </ScrollView>
                                </View>
                            ) : (
                                <View style={styles.noDataCard}>
                                    <Text style={styles.noDataText}>No grade level fee data to display.</Text>
                                </View>
                            )}

                            {/* Admin Actions */}
                            <Text style={styles.sectionTitle}>Admin Actions</Text>
                            <View style={styles.actionsGrid}>
                                <ActionCard
                                    icon="chart-line-variant"
                                    title="More Analytics"
                                    onPress={() => navigation.navigate('analyticsScreen')}
                                    gradientColors={['#1B5E20', '#0A3B11']}
                                />
                                <ActionCard
                                    icon="account-plus"
                                    title="Add Staff Member"
                                    onPress={() => navigation.navigate('addStaff')}
                                    gradientColors={['#388E3C', '#2E7D32']}
                                />
                                <ActionCard
                                    icon="cash-minus"
                                    title="Adjust Student Fees"
                                    onPress={() => Alert.alert('Feature Coming Soon!', 'Adjusting fees functionality will be added here.')}
                                    gradientColors={['#F57C00', '#C25A00']}
                                />
                                <ActionCard
                                    icon="file-document"
                                    title="Generate Reports"
                                    onPress={() => Alert.alert('Feature Coming Soon!', 'Detailed report generation will be added here.')}
                                    gradientColors={['#1976D2', '#0D47A1']}
                                />
                                {/* Add more admin-specific actions if needed */}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F8FA', // Even lighter background for overall screen
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A5319',
        marginBottom: 3,
    },
    currentDateText: {
        fontSize: 14,
        color: '#757575',
    },
    logoutButton: {
        padding: 10,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        marginLeft: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#616161',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginTop: 30,
        marginBottom: 15,
        textAlign: 'left',
        paddingLeft: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    totalExpectedCard: { // New style for the prominent total expected fees display
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    totalExpectedLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 5,
    },
    totalExpectedValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2196F3', // Using blue for expected value
    },
    totalExpectedHint: {
        fontSize: 12,
        color: '#757575',
        marginTop: 5,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    chartTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 15,
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 15,
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 8,
    },
    legendColorBox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 15,
        color: '#333',
    },
    noDataCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
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
    noDataText: {
        fontSize: 16,
        color: '#616161',
        textAlign: 'center',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionCardButton: {
        width: '48%',
        aspectRatio: 1,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    actionCardGradient: {
        flex: 1,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionCardText: {
        color: '#fff',
        marginTop: 12,
        fontWeight: '700',
        fontSize: 15,
        textAlign: 'center',
    },
});
