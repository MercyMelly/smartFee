import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  token: null,
  role: null,
  email: null,
  user: null,

  

  login: async ({ token, role, email, user }) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ token, role, email, user });
    } catch (error) {
      console.error('Error storing login info:', error);
    }
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role');
      const email = await AsyncStorage.getItem('email');
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (token && role && email) {
        set({ token, role, email, user });
      }
    } catch (error) {
      console.error('Error loading auth info:', error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.clear();
      set({ token: null, role: null, email: null, user: null });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },
}));
