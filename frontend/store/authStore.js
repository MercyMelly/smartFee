// import { create } from 'zustand';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const useAuthStore = create((set) => ({
//   token: null,
//   role: null,
//   email: null,
//   user: null,

//   login: async ({ token, role, email, user }) => {
//     try {
//       await AsyncStorage.setItem('token', token);
//       await AsyncStorage.setItem('role', role);
//       await AsyncStorage.setItem('email', email);
//       await AsyncStorage.setItem('user', JSON.stringify(user));
//       set({ token, role, email, user });
//     } catch (error) {
//       console.error('Error storing login info:', error);
//     }
//   },

//   loadAuth: async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const role = await AsyncStorage.getItem('role');
//       const email = await AsyncStorage.getItem('email');
//       const userData = await AsyncStorage.getItem('user');
//       const user = userData ? JSON.parse(userData) : null;

//       if (token && role && email) {
//         set({ token, role, email, user });
//       }
//     } catch (error) {
//       console.error('Error loading auth info:', error);
//     }
//   },

//   logout: async () => {
//     try {
//       await AsyncStorage.clear();
//       set({ token: null, role: null, email: null, user: null });
//     } catch (error) {
//       console.error('Error during logout:', error);
//     }
//   },
// }));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { produce } from 'immer';

export const useAuthStore = create((set) => ({
    token: null,
    isAuthenticated: false,
    isLoading: true,
    user: null, // Stores the full user object { _id, fullName, email, role, phoneNumber }
    role: null, // Stores just the user's role string

    login: async (authData) => { // authData is the entire res.data from backend (e.g., { token, user, userRole, ... })
        try {
            // Destructure the expected consistent response structure
            const { token, user } = authData;

            // Perform essential data validation
            if (!token || !user || !user.role || !user.email || !user._id) {
                console.warn("Login/Signup response data incomplete:", { token, user });
                throw new Error("Missing essential authentication data (token, user object, or user.role/email/id).");
            }

            // The 'user' object from the backend is now the definitive source of user info
            const finalUserObject = {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role, // Use the role from the consistent user object
                phoneNumber: user.phoneNumber,
            };

            // Store in AsyncStorage
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', finalUserObject.role); // Store the determined role
            await AsyncStorage.setItem('userEmail', finalUserObject.email); // Store email
            await AsyncStorage.setItem('authUser', JSON.stringify(finalUserObject)); // Store full user object

            // Update Zustand state
            set(produce((state) => {
                state.token = token;
                state.isAuthenticated = true;
                state.isLoading = false;
                state.user = finalUserObject; // Set the full user object
                state.role = finalUserObject.role; // Set the determined role
            }));

        } catch (error) {
            console.error("Failed to login or store data:", error);
            // Alert.alert('Authentication Error', error.message || 'Failed to process authentication data.'); // Avoid alerts in store
            // Reset state on error
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
            // Remove all auth data from AsyncStorage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('a    uthUser');

            set(produce((state) => {
                state.token = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                state.user = null;
                state.role = null;
            }));
        } catch (error) {
            console.error("Error during logout:", error);
        }
    },

    loadAuth: async () => {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            const userRole = await AsyncStorage.getItem('userRole');
            const authUserJson = await AsyncStorage.getItem('authUser');

            if (userToken && userRole && authUserJson) {
                const authUser = JSON.parse(authUserJson);
                set(produce((state) => {
                    state.token = userToken;
                    state.isAuthenticated = true;
                    state.user = authUser;
                    state.role = userRole;
                    state.isLoading = false;
                }));
            } else {
                // If data is missing or corrupted, ensure not authenticated
                await AsyncStorage.clear(); // Clear any partial data
                set(produce((state) => {
                    state.token = null;
                    state.isAuthenticated = false;
                    state.user = null;
                    state.role = null;
                    state.isLoading = false;
                }));
            }
        } catch (error) {
            console.error("Failed to load auth data from storage:", error);
            // In case of error, ensure not authenticated
            set(produce((state) => {
                state.token = null;
                state.isAuthenticated = false;
                state.user = null;
                state.role = null;
                state.isLoading = false;
            }));
        } finally {
            // Always set isLoading to false after an attempt to load
            set(produce((state) => {
                state.isLoading = false;
            }));
        }
    },
}));