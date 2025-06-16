import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
 
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity onPress={() => navigation.navigate('bursarHome')}>
        <Icon name="view-dashboard" size={28} color="#2e7d32" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('studentsList')}>
        <Icon name="account-group" size={28} color="#777" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('payments')}>
        <Icon name="cash" size={28} color="#777" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('produce')}>
        <Icon name="scale-balance" size={28} color="#777" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('settings')}>
        <Icon name="cog-outline" size={28} color="#2e7d32" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default BottomNav;
