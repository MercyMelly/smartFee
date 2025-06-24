import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Alert,
    TouchableOpacity,
    Platform
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native';

// IMPORTANT: Ensure this BASE_URL matches your backend server's IP/ngrok URL!
const BASE_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api'; // Update this to your active backend URL

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: '#E8F5E9', // Light green from your palette
    backgroundGradientFromOpacity: 1,
    backgroundGradientTo: '#C8E6C9', // Slightly darker green
    backgroundGradientToOpacity: 1,
    color: (opacity = 1) => `rgba(26, 83, 25, ${opacity})`, // Main green color for labels/lines
    strokeWidth: 2, // for line charts
    barPercentage: 0.7,
    useShadowColorFromDataset: false, // optional
    fillShadowGradient: '#4CAF50', // Fill color for bars/areas
    fillShadowGradientOpacity: 0.8,
    labelColor: (opacity = 1) => `rgba(26, 83, 25, ${opacity})`, // Labels
    propsForLabels: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    decimalPlaces: 0, // No decimal places for values on chart if they are large sums
};

const AdminAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const { token, logout } = useAuthStore();

    const fetchAnalyticsData = useCallback(async () => {
        setLoading(true);
        if (!token) {
            Alert.alert('Authentication Error', 'No token found. Please log in again.');
            logout();
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: { 'x-auth-token': token },
                timeout: 15000, // Add a 15-second timeout for the request
            };
            const response = await axios.get(`${BASE_URL}/dashboard/summary`, config);
            setSummaryData(response.data);
            console.log("Analytics data fetched successfully:", response.data); // Log successful data
        } catch (error) {
            console.error('Error fetching analytics data:');
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("  Status:", error.response.status);
                console.error("  Data:", error.response.data);
                console.error("  Headers:", error.response.headers);
                Alert.alert('Error', error.response.data?.message || `Server responded with status ${error.response.status}.`);
                if (error.response.status === 401 || error.response.status === 403) {
                    logout();
                }
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an http.ClientRequest in node.js
                console.error("  No response received. Request:", error.request);
                Alert.alert('Error', 'No response from server. Please check your network connection and backend server status.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("  Error message:", error.message);
                if (axios.isCancel(error)) {
                    console.error('  Request canceled:', error.message);
                } else if (error.code === 'ECONNABORTED') { // Specific code for timeout
                    Alert.alert('Error', 'Request timed out. The server is taking too long to respond.');
                } else {
                    Alert.alert('Error', `An unexpected error occurred: ${error.message}.`);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useFocusEffect(
        useCallback(() => {
            fetchAnalyticsData();
        }, [fetchAnalyticsData])
    );

    const formatCurrency = (amount) => {
        return `KES ${Number(amount).toLocaleString('en-US')}`;
    };

    // Prepare data for Pie Chart: Collected vs. Outstanding
    const pieChartDataCollectedOutstanding = summaryData ? [
        {
            name: 'Collected',
            value: summaryData.totalFeesCollected || 0,
            color: '#4CAF50', // Green
            legendFontColor: '#333',
            legendFontSize: 14,
        },
        {
            name: 'Outstanding',
            value: summaryData.totalOutstanding || 0,
            color: '#D32F2F', // Red
            legendFontColor: '#333',
            legendFontSize: 14,
        },
    ] : [];

    // Prepare data for Pie Chart: Payments by Method
    const pieChartDataPaymentsByMethod = summaryData && summaryData.paymentsByMethod ?
        summaryData.paymentsByMethod.map((item, index) => ({
            name: item._id || 'Unknown',
            value: item.totalAmount || 0,
            color: ['#66BB6A', '#2196F3', '#FFC107', '#7B1FA2', '#FF8A65'][index % 5], // A palette of your colors
            legendFontColor: '#333',
            legendFontSize: 14,
        })) : [];

    // Prepare data for Bar Chart: Fees by Grade
    const barChartDataFeesByGrade = summaryData && summaryData.feesByGrade ? {
        labels: summaryData.feesByGrade.map(item => item._id || 'N/A'), // Grade levels
        datasets: [
            {
                data: summaryData.feesByGrade.map(item => item.totalExpectedForGrade || 0),
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for expected
                label: 'Expected',
            },
            {
                data: summaryData.feesByGrade.map(item => item.totalCollectedForGrade || 0),
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for collected
                label: 'Collected',
            }
        ]
    } : { labels: [], datasets: [] };


    return (
        <LinearGradient colors={['#E8F5E9', '#DCEDC8']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color="#1A5319" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Analytics & Reports</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1A5319" />
                        <Text style={styles.loadingText}>Loading analytics...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        {/* Overall Fee Status (Pie Chart) */}
                        {summaryData && (summaryData.totalFeesCollected > 0 || summaryData.totalOutstanding > 0) ? (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>Overall Fee Status</Text>
                                <PieChart
                                    data={pieChartDataCollectedOutstanding}
                                    width={screenWidth - 40}
                                    height={200}
                                    chartConfig={chartConfig}
                                    accessor="value"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    center={[10, 0]}
                                    absolute // Display absolute values in legend
                                />
                                <View style={styles.legendContainer}>
                                    {pieChartDataCollectedOutstanding.map((item, index) => (
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
                                <Text style={styles.noDataText}>No fee data to display for overall status.</Text>
                            </View>
                        )}


                        {/* Payments by Method (Pie Chart) */}
                        {summaryData && summaryData.paymentsByMethod && summaryData.paymentsByMethod.length > 0 ? (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>Payments by Method</Text>
                                <PieChart
                                    data={pieChartDataPaymentsByMethod}
                                    width={screenWidth - 40}
                                    height={200}
                                    chartConfig={chartConfig}
                                    accessor="value"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    center={[10, 0]}
                                    absolute
                                />
                                <View style={styles.legendContainer}>
                                    {pieChartDataPaymentsByMethod.map((item, index) => (
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
                                <Text style={styles.noDataText}>No payment method data to display.</Text>
                            </View>
                        )}


                        {/* Fees by Grade Level (Bar Chart) */}
                        {summaryData && summaryData.feesByGrade && summaryData.feesByGrade.length > 0 ? (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>Fees by Grade Level</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <BarChart
                                        data={barChartDataFeesByGrade}
                                        width={Math.max(screenWidth - 40, summaryData.feesByGrade.length * 70)} // Adjust width dynamically
                                        height={250}
                                        chartConfig={chartConfig}
                                        verticalLabelRotation={30}
                                        showBarTops={true}
                                        showValuesOnTopOfBars={true} // Display values on top of bars
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


                        {/* Top Defaulters List */}
                        {summaryData && summaryData.topDefaulters && summaryData.topDefaulters.length > 0 && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Top Defaulters</Text>
                                {summaryData.topDefaulters.map((defaulter, index) => (
                                    <View key={index} style={styles.defaulterItem}>
                                        <Text style={styles.defaulterName}>{defaulter.fullName} ({defaulter.admissionNumber})</Text>
                                        <Text style={styles.defaulterAmount}>{formatCurrency(defaulter.feeDetails.remainingBalance)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
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
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A5319',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#616161',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
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
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 15,
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 5,
    },
    legendColorBox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#333',
    },
    card: { // Reused for Top Defaulters list
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
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
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 15,
        textAlign: 'center',
    },
    defaulterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    defaulterName: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    defaulterAmount: {
        fontSize: 15,
        color: '#D32F2F', // Red for outstanding
        fontWeight: 'bold',
    },
    noDataCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
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
});

export default AdminAnalyticsScreen;
