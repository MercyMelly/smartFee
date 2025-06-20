import React, { useState } from 'react';
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Platform, // For platform-specific shadows
    // Removed: Dimensions, // No longer needed for font scaling
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
// Removed: import BottomNav from '../screens/bottomNav';

// Removed: Get screen width for responsive font sizing
// Removed: const { width } = Dimensions.get('window');

// Removed: Function to scale font size based on screen width
// Removed: const scaleFont = (size) => {
// Removed:     const standardScreenWidth = 375; // iPhone 6/7/8 width
// Removed:     const scale = width / standardScreenWidth;
// Removed:     return Math.round(size * scale);
// Removed: };

const SettingsScreen = () => {
    const [darkMode, setDarkMode] = useState(false);
    const navigation = useNavigation();
    const logout = useAuthStore(state => state.logout);
    const route = useRoute();
    const token = route.params?.token || useAuthStore((state) => state.token);

    const handleLogout = () => {
        Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    navigation.replace('login');
                },
            },
        ]);
    };

    const handleResetPassword = () => {
        navigation.navigate('resetPassword', { token: token });
    };

    return (
        <LinearGradient colors={['#E8F5E9', '#DCEDC8']} style={styles.gradientContainer}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.header}>Settings</Text>
                        <Text style={styles.subHeader}>Manage your app preferences and account</Text>
                    </View>

                    {/* Preferences Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                        <View style={styles.optionRow}>
                            <View style={styles.rowLeft}>
                                <Icon name="theme-light-dark" size={24} color="#388E3C" />
                                <Text style={styles.optionText}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#767577', true: '#81b0ff' }}
                                thumbColor={darkMode ? '#4CAF50' : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                            />
                        </View>
                    </View>

                    {/* Account Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>

                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={handleResetPassword}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rowLeft}>
                                <Icon name="lock-reset" size={24} color="#388E3C" />
                                <Text style={styles.optionText}>Reset Password</Text>
                            </View>
                            <Icon name="chevron-right" size={24} color="#9E9E9E" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rowLeft}>
                                <Icon name="logout" size={24} color="#D32F2F" />
                                <Text style={[styles.optionText, { color: '#D32F2F' }]}>Log Out</Text>
                            </View>
                            <Icon name="chevron-right" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
                            <View style={styles.rowLeft}>
                                <Icon name="information-outline" size={24} color="#388E3C" />
                                <Text style={styles.optionText} adjustsFontSizeToFit>Version</Text>
                            </View>
                            <Text style={styles.detailText}>1.0.0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
                            <View style={styles.rowLeft}>
                                <Icon name="file-document-outline" size={24} color="#388E3C" />
                                <Text style={styles.optionText} adjustsFontSizeToFit>Privacy Policy</Text>
                            </View>
                            <Icon name="chevron-right" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
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
        padding: 20, // Reverted to fixed padding
        paddingBottom: 20, // Reverted to fixed padding
    },
    headerContainer: {
        marginBottom: 30, // Reverted to fixed margin
        alignItems: 'center',
    },
    header: {
        fontSize: 32, // Reverted to fixed font size
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 8, // Reverted to fixed margin
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 16, // Reverted to fixed font size
        color: '#555',
        textAlign: 'center',
        paddingHorizontal: 20, // Reverted to fixed padding
    },
    section: {
        marginBottom: 25, // Reverted to fixed margin
    },
    sectionTitle: {
        fontSize: 19, // Reverted to fixed font size
        fontWeight: '600',
        marginBottom: 15, // Reverted to fixed margin
        color: '#388E3C',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
        paddingBottom: 8, // Reverted to fixed padding
        marginLeft: 5, // Reverted to fixed margin
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12, // Reverted to fixed border radius
        paddingVertical: 18, // Reverted to fixed padding
        paddingHorizontal: 20, // Reverted to fixed padding
        marginBottom: 10, // Reverted to fixed margin
        justifyContent: 'space-between',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 }, // Reverted to fixed shadow offset
                shadowOpacity: 0.1,
                shadowRadius: 5, // Reverted to fixed shadow radius
            },
            android: {
                elevation: 5, // Reverted to fixed elevation
            },
        }),
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 17, // Reverted to fixed font size
        marginLeft: 18, // Reverted to fixed margin
        color: '#333',
    },
    detailText: {
        fontSize: 16, // Reverted to fixed font size
        color: '#757575',
    }
});

export default SettingsScreen;