import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  token: null,
  role: null,
  email: null,

  login: async ({ token, role, email }) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', role);
    await AsyncStorage.setItem('email', email);
    set({ token, role, email });
  },

  loadAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    const email = await AsyncStorage.getItem('email');
    if (token) set({ token, role, email });
  },

  logout: async () => {
    await AsyncStorage.clear();
    set({ token: null, role: null, email: null });
  },
}));
