import React, { useState, useCallback } from 'react'; // Added useCallback
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { logout, user } = useAuthStore(); 
    const route = useRoute();
    // const token = route.params?.token || useAuthStore((state) => state.token); 

    // Function to handle logout confirmation
    const handleLogout = useCallback(() => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    // Navigation handled by App.js based on auth state change
                },
            },
        ]);
    }, [logout]);

    // const handleResetPassword = useCallback(() => {
    //     navigation.navigate('forgotPassword');
    // }, [navigation]);

    // Reusable component for setting options
    const SettingsOption = ({ iconName, title, onPress, isDestructive = false }) => (
        <TouchableOpacity
            style={styles.optionRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.rowLeft}>
                <Icon name={iconName} size={22} color={isDestructive ? '#D32F2F' : '#4CAF50'} />
                <Text style={[styles.optionText, isDestructive && styles.destructiveText]}>{title}</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#BDBDBD" />
        </TouchableOpacity>
    );

    // Reusable component for info rows (like Version or User Info)
    const InfoRow = ({ iconName, title, value }) => (
        <View style={styles.optionRow}>
            <View style={styles.rowLeft}>
                <Icon name={iconName} size={22} color="#4CAF50" />
                <Text style={styles.optionText}>{title}</Text>
            </View>
            <Text style={styles.detailText}>{value}</Text>
        </View>
    );

    return (
        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.gradientContainer}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.header}>Settings</Text>
                        <Text style={styles.subHeader}>Manage your app preferences and account</Text>
                    </View>

                    {/* Bursar Account Information Section */}
                    {user && ( // Only render if user object exists
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                <Icon name="account-circle-outline" size={20} color="#388E3C" /> My Account
                            </Text>
                            <InfoRow iconName="account" title="Full Name" value={user.fullName || 'N/A'} />
                            <InfoRow iconName="email-outline" title="Email" value={user.email || 'N/A'} />
                            <InfoRow iconName="badge-account-outline" title="Role" value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'} />
                            {user.username && <InfoRow iconName="account-details-outline" title="Username" value={user.username} />}
                            {/* You can add more user details here if available in your user object */}
                        </View>
                    )}

                    {/* Account Management Section */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                            <Icon name="cog-outline" size={20} color="#388E3C" /> Account Actions
                        </Text>
                        {/* <SettingsOption
                            iconName="lock-reset"
                            title="Reset Password"
                            onPress={handleResetPassword}
                        /> */}
                        <SettingsOption
                            iconName="logout"
                            title="Log Out"
                            onPress={handleLogout}
                            isDestructive={true} // Mark as destructive for red color
                        />
                    </View>

                    {/* About Section */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                            <Icon name="information-outline" size={20} color="#388E3C" /> About App
                        </Text>
                        <InfoRow iconName="code-tags" title="Version" value="1.0.0" />
                        <SettingsOption
                            iconName="file-document-outline"
                            title="Privacy Policy"
                            onPress={() => Alert.alert('Privacy Policy')}
                        />
                    </View>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 30, // More top padding
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
        backgroundColor: 'transparent', // Make header background transparent
    },
    header: {
        fontSize: 34, // Slightly larger
        fontWeight: 'bold',
        color: '#1B5E20', // Dark green
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 15,
        marginBottom: 25, // More space between sections
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '700', // Bolder
        marginBottom: 18, // More space below title
        color: '#388E3C', // Accent green
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', // Lighter border
        paddingBottom: 10,
        marginLeft: 0, // Reset margin
        textAlign: 'left',
        flexDirection: 'row', // For icon and text alignment
        alignItems: 'center',
        gap: 10, // Space between icon and text
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15, // Increased vertical padding
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5', // Very light grey separator
        // No background or shadow here, sectionCard handles it
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 17,
        marginLeft: 15, // Space from icon
        color: '#333',
        fontWeight: '500', // Medium weight
    },
    destructiveText: {
        color: '#D32F2F', // Red for logout
        fontWeight: '600',
    },
    detailText: {
        fontSize: 16,
        color: '#757575',
        fontWeight: '400',
    },
});

export default SettingsScreen;
