import React from 'react';
import { 
  View, 
  ActivityIndicator,
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  Alert,
  StatusBar 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config';


export default function PaymentWebViewScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { authorization_url } = route.params;

    const handleNavigationChange = (navState) => {
        if (navState.url.includes('/payment-success')) {
            const url = new URL(navState.url);
            const reference = url.searchParams.get('reference');
            
            navigation.navigate('paySuccess', { 
                reference,
                message: 'Payment successful! Records will update shortly.' 
            });
        }
    };

    return (
        <WebView
            source={{ uri: authorization_url }}
            onNavigationStateChange={handleNavigationChange}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="large" />}
            onError={(error) => {
                console.error('WebView error:', error);
                navigation.goBack();
                Alert.alert('Error', 'Failed to load payment page');
            }}
        />
    );
}
const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    closeButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2E7D32',
    },
    headerSpacer: {
        width: 30,
    },
    webViewWrapper: {
        flex: 1,
        marginTop: 15,
        marginHorizontal: 15,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F8F6',
        padding: 20,
    },
    errorText: {
        marginTop: 15,
        fontSize: 18,
        color: '#D32F2F',
        textAlign: 'center',
        fontWeight: '500',
    }
});