import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { produce } from 'immer';
import axios from 'axios';

export const useAuthStore = create((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  role: null,

  login: async (authData) => {
    try {
      const { token, user } = authData;
      if (!token || !user || !user.role || !user.email || !user._id) {
        throw new Error("Missing authentication data.");
      }

      const finalUserObject = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
      };

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', finalUserObject.role);
      await AsyncStorage.setItem('userEmail', finalUserObject.email);
      await AsyncStorage.setItem('authUser', JSON.stringify(finalUserObject));

      // Set Axios Authorization header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set(produce((state) => {
        state.token = token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.user = finalUserObject;
        state.role = finalUserObject.role;
      }));
    } catch (error) {
      console.error("Authentication error:", error);
      set(produce((state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
        state.role = null;
      }));
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'userRole',
        'userEmail',
        'authUser'
      ]);
      delete axios.defaults.headers.common['Authorization'];
      set(produce((state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
        state.role = null;
      }));
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  loadAuth: async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userRole = await AsyncStorage.getItem('userRole');
      const authUserJson = await AsyncStorage.getItem('authUser');

      if (userToken && userRole && authUserJson) {
        const authUser = JSON.parse(authUserJson);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        set(produce((state) => {
          state.token = userToken;
          state.isAuthenticated = true;
          state.user = authUser;
          state.role = userRole;
          state.isLoading = false;
        }));
      } else {
        await AsyncStorage.clear();
        set(produce((state) => {
          state.token = null;
          state.isAuthenticated = false;
          state.user = null;
          state.role = null;
          state.isLoading = false;
        }));
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
      set(produce((state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.isLoading = false;
      }));
    }
  },
}));
