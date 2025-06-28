import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Added for consistent styling

const LandingPage = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
      <View style={styles.container}>
        {/* Using a placeholder image or ensure your asset path is correct */}
        <Image 
          source={require('../assets/student.jpeg')} // Verify this path is correct for your project
          style={styles.logo} 
          onError={() => console.log("Error loading image from '../assets/student.jpeg'")} // Add error handling
        />
        
        <Text style={styles.title} adjustsFontSizeToFit numberOfLines={2}>
          Welcome to SmartFee
        </Text>

        <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2}>
          Simplify School Fees Management
        </Text>

        <Text style={styles.tagline} adjustsFontSizeToFit numberOfLines={3}>
          Fast, secure, and transparent fee tracking — anytime, anywhere.
        </Text>

        {/* Changed navigation target from 'signup' to 'login' */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('login')}>
          <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Use transparent background since LinearGradient is the background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%', // Ensure container takes full width
  },
  logo: {
    width: 200,
    height: 150,
    marginBottom: 30,
    borderRadius: 15, // Slightly more rounded corners
    borderWidth: 2,
    borderColor: '#2e7d32',
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '80%', // Make button slightly less wide for better aesthetics
    maxWidth: 300, // Max width for larger screens
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 20, // Add some top margin
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default LandingPage;
