import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PaymentSuccessScreen() {
    const navigation = useNavigation();

    // You might want to automatically navigate back after a few seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.popToTop(); // Go back to the very first screen (Dashboard)
            navigation.navigate('parentsHome', { refresh: true }); // Ensure dashboard refreshes
        }, 3000); // Navigate back after 3 seconds

        return () => clearTimeout(timer); // Cleanup timer
    }, [navigation]);

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Ionicons name="checkmark-circle-outline" size={120} color="#2E7D32" />
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.message}>
                        Thank you for your payment. Your school records are being updated.
                    </Text>
                    <Text style={styles.subMessage}>
                        You will be redirected to the dashboard shortly.
                    </Text>
                    <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 20 }} />
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 18,
        color: '#424242',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 10,
    },
    subMessage: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
