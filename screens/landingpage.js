import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingPage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image source={require('../assets/student.jpeg')} style={styles.logo} />
      
      <Text style={styles.title} adjustsFontSizeToFit numberOfLines={2}>
        Welcome to SmartFee
      </Text>

      <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2}>
        Simplify School Fees
      </Text>

      <Text style={styles.tagline} adjustsFontSizeToFit numberOfLines={3}>
        Fast, secure, and transparent fee tracking — anytime, anywhere.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('signup')}>
        <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 150,
    marginBottom: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2e7d32',
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
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default LandingPage;
