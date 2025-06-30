import React, { useState } from 'react';
import {View,ActivityIndicator,TouchableOpacity,StyleSheet,SafeAreaView,Text,Alert,StatusBar} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentWebViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { authorization_url } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleNavigationChange = (navState) => {
    if (navState.url.includes('/payment-success')) {
      const url = new URL(navState.url);
      const reference = url.searchParams.get('reference');

      navigation.navigate('paySuccess', {
        reference,
        message: 'Payment successful! Your records will be updated shortly.'
      });
    } else if (
      navState.url.includes('/payment-cancel') ||
      navState.url.includes('/payment-failure')
    ) {
      Alert.alert('Payment Cancelled', 'Your payment was not completed. Please try again.');
      navigation.goBack();
    }
  };

  return (
    <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Exit Payment",
                  "Are you sure you want to cancel the payment?",
                  [
                    { text: "No", style: "cancel" },
                    { text: "Yes", onPress: () => navigation.goBack() }
                  ]
                );
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle-outline" size={30} color="#D32F2F" />
            </TouchableOpacity>
            <Text style={styles.title}>Complete Payment</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#D32F2F" />
            <Text style={styles.errorText}>
              Oops! Something went wrong loading the payment page.
              Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                setLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.webViewWrapper}>
            <WebView
              source={{ uri: authorization_url }}
              style={styles.webView}
              onNavigationStateChange={handleNavigationChange}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView failed to load:', nativeEvent.description);
                setLoading(false);
                setError(true);
              }}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading payment page...</Text>
              </View>
            )}
          </View>
        )}
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
  headerContainer: {
    paddingTop: StatusBar.currentHeight || 35, 
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  closeButton: {
    padding: 5,
    zIndex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  webViewWrapper: {
    flex: 1,
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    borderRadius: 15,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    marginTop: 20,
    fontSize: 17,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});