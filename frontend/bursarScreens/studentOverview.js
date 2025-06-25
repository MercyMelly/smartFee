import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator,
    TextInput,
    FlatList, // Added FlatList for displaying the student list
    KeyboardAvoidingView, // Added for keyboard handling
    Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore'; // Adjusted path to authStore
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // For icons like search, school, people, cash, time

// Expo FileSystem, Sharing, and WebBrowser for PDF handling
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';
import { Buffer } from 'buffer'; // For handling binary data in PDF generation


// IMPORTANT: Replace with your active ngrok HTTPS URL during development,
// or your actual production backend domain.
const BASE_URL = 'https://d25e-62-254-118-133.ngrok-free.app/api'; // Ensure this matches your backend

export default function StudentOverview() {
    const navigation = useNavigation();
    const { token, logout } = useAuthStore();

    // State for search and loading
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // State for student data (all students and current profile)
    const [allStudents, setAllStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [currentStudentProfile, setCurrentStudentProfile] = useState(null); // This holds the detailed profile

    // Fetch all students on component mount and when the screen is focused
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        if (!token) {
            Alert.alert('Authentication Error', 'No token found. Please log in again.');
            logout();
            setLoading(false);
            return;
        }
        try {
            const config = {
                headers: {
                    'x-auth-token': token,
                },
            };
            const res = await axios.get(`${BASE_URL}/students`, config);
            setAllStudents(res.data);
            setFilteredStudents(res.data); // Initialize filtered list with all students
        } catch (err) {
            console.error('Error fetching all students:', err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Failed to load student list. Please check your network and server.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    // Effect to refetch data and reset state when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setCurrentStudentProfile(null); // Clear detailed profile when screen is focused
            setSearchQuery(''); // Clear search query
            fetchAllStudents(); // Fetch the full list again
            return () => {
                // Optional cleanup
            };
        }, [fetchAllStudents])
    );

    // Handle unified search by name or admission number for the FlatList
    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text) {
            setFilteredStudents(allStudents); // If search query is empty, show all students
            return;
        }
        const lowerCaseText = text.toLowerCase();
        const filteredData = allStudents.filter(s =>
            (s.fullName && s.fullName.toLowerCase().includes(lowerCaseText)) ||
            (s.admissionNumber && s.admissionNumber.toLowerCase().includes(lowerCaseText))
        );
        setFilteredStudents(filteredData);
    };

    // Handle navigation/profile load from a student list item click
    const handleSelectStudentFromList = useCallback(async (admissionNumber) => {
        if (!admissionNumber) {
            Alert.alert('Error', 'Student admission number is missing.');
            return;
        }
        if (!token) {
            Alert.alert('Authentication Error', 'No token found. Please log in again.');
            logout();
            return;
        }

        setLoading(true);
        setCurrentStudentProfile(null); // Clear previous profile before loading new one

        try {
            const config = {
                headers: {
                    'x-auth-token': token,
                },
            };
            const response = await axios.get(`${BASE_URL}/students/${admissionNumber}/profile`, config);
            setCurrentStudentProfile(response.data); // Set the detailed profile
            setSearchQuery(''); // Clear search query after successfully loading profile
            setFilteredStudents([]); // Clear filtered list to show only the selected profile
        } catch (error) {
            console.error('Error fetching student profile from list:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Failed to fetch student profile. Please try again.';
            Alert.alert('Error', errorMessage);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);


    // Generate Receipt functionality (Moved from studentProfile.js)
    const handleGenerateReceipt = async (paymentId, transactionReference) => {
        if (!token) {
            Alert.alert('Authentication Error', 'You are not logged in. Please log in to generate receipts.');
            logout();
            return;
        }

        try {
            Alert.alert('Generating Receipt', 'Please wait while we prepare your receipt...');
            const url = `${BASE_URL}/payments/generate-receipt/${paymentId}`;
            const fileName = `receipt_${transactionReference || paymentId}.pdf`;
            const downloadPath = FileSystem.documentDirectory + fileName;

            const config = {
                headers: {
                    'x-auth-token': token,
                },
                responseType: 'arraybuffer', // Crucial for receiving binary data like PDF
            };

            const response = await axios.get(url, config);

            // Convert ArrayBuffer to Buffer, then to Base64
            const pdfBase64 = Buffer.from(response.data, 'binary').toString('base64');

            // Save the PDF to a local file
            await FileSystem.writeAsStringAsync(downloadPath, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });

            Alert.alert('Receipt Downloaded!', `Receipt saved to: ${downloadPath}`);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadPath, {
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf', // iOS specific UTI for PDF
                    dialogTitle: 'Open Receipt',
                });
            } else {
                if (Platform.OS === 'ios') {
                    await WebBrowser.openBrowserAsync(downloadPath);
                } else {
                    const contentUri = await FileSystem.getContentUriAsync(downloadPath);
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                        type: 'application/pdf',
                    });
                }
            }
        } catch (error) {
            console.error('Error downloading/generating receipt:', error.response?.data || error.message || error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate receipt. Please try again.');
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            }
        }
    };


    // Render item for the FlatList (All Students)
    const renderStudentListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.listItemCard}
            onPress={() => handleSelectStudentFromList(item.admissionNumber)}
        >
            <View style={styles.listItemDetails}>
                <Text style={styles.listItemName}>{item.fullName || 'Name N/A'}</Text>
                <Text style={styles.listItemDetail}>Adm No: {item.admissionNumber || 'N/A'}</Text>
                {item.gradeLevel && <Text style={styles.listItemDetail}>Grade: {item.gradeLevel}</Text>}
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#757575" />
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Fixed Header Content (Title and Search) */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.mainTitle}>Student Information</Text>

                        {/* Unified Search Input for Name/Admission No */}
                        {!currentStudentProfile && ( // Only show search if no detailed profile is active
                            <View style={styles.searchCard}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="search-outline" size={20} color="#757575" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Search by Name or Admission No."
                                        placeholderTextColor="#757575"
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                        autoCapitalize="words"
                                        keyboardType="default" // Changed to default for names
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
                                            <Ionicons name="close-circle" size={20} color="#757575" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Conditional Content: Loading, Detailed Profile, No Results, or Student List */}
                    {loading && (
                        <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 20 }} />
                    )}

                    {!loading && currentStudentProfile ? (
                        // Display detailed student profile
                        <FlatList // Using FlatList to handle potential scrolling within the profile details
                            data={[currentStudentProfile]}
                            keyExtractor={(item) => item.student?._id?.toString() || 'profile-key'}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.profileListContent}
                            renderItem={({ item: profile }) => ( // Renamed item to profile for clarity
                                <View style={styles.profileCard}>
                                    {/* Button to close the detailed profile and go back to the list */}
                                    <TouchableOpacity onPress={() => setCurrentStudentProfile(null)} style={styles.closeProfileButton}>
                                        <Ionicons name="close-circle-outline" size={30} color="#D32F2F" />
                                    </TouchableOpacity>

                                    {/* Student Information Section */}
                                    <Text style={styles.sectionTitle}>
                                        <Ionicons name="school-outline" size={24} color="#388E3C" /> Student Information
                                    </Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Full Name:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.fullName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Admission No.:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.admissionNumber || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Grade Level:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.gradeLevel || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Boarding Status:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.boardingStatus || 'N/A'}</Text>
                                    </View>
                                    {profile.student?.gender && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Gender:</Text>
                                            <Text style={styles.detailValue}>{profile.student.gender}</Text>
                                        </View>
                                    )}
                                    {profile.student?.hasTransport && profile.student?.transportRoute && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Transport Route:</Text>
                                            <Text style={styles.detailValue}>{profile.student.transportRoute}</Text>
                                        </View>
                                    )}

                                    {/* Parent/Guardian Section */}
                                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                        <Ionicons name="people-outline" size={24} color="#388E3C" /> Parent/Guardian
                                    </Text>
                                    {profile.student?.parent ? (
                                        <>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Name:</Text>
                                                <Text style={styles.detailValue}>{profile.student.parent.name || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Phone:</Text>
                                                <Text style={styles.detailValue}>{profile.student.parent.phone || 'N/A'}</Text>
                                            </View>
                                            {profile.student.parent.email && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Email:</Text>
                                                    <Text style={styles.detailValue}>{profile.student.parent.email}</Text>
                                                </View>
                                            )}
                                            {profile.student.parent.address && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Address:</Text>
                                                    <Text style={styles.detailValue}>{profile.student.parent.address}</Text>
                                                </View>
                                            )}
                                        </>
                                    ) : (
                                        <Text style={styles.noInfoText}>Parent/Guardian information not available.</Text>
                                    )}

                                    {/* Fee Statement Section */}
                                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                        <Ionicons name="cash-outline" size={24} color="#388E3C" /> Fee Statement (Current Term)
                                    </Text>
                                    <View style={styles.feeItemsContainer}>
                                        {profile.feeDetails?.termlyComponents && profile.feeDetails.termlyComponents.length > 0 ? (
                                            profile.feeDetails.termlyComponents.map((item, index) => (
                                                <View key={index} style={styles.feeItem}>
                                                    <Text style={styles.feeItemName}>{item.name}:</Text>
                                                    <Text style={styles.feeItemAmount}>KSh {item.amount?.toLocaleString() || '0'}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noInfoText}>No fee components defined.</Text>
                                        )}
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Termly Fee:</Text>
                                        <Text style={styles.summaryValue}>KSh {profile.feeDetails?.totalTermlyFee?.toLocaleString() || '0'}</Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.paidRow]}>
                                        <Text style={styles.summaryLabel}>Fees Paid:</Text>
                                        <Text style={styles.summaryValuePaid}>KSh {profile.feeDetails?.feesPaid?.toLocaleString() || '0'}</Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.balanceRow]}>
                                        <Text style={styles.summaryLabel}>Remaining Balance:</Text>
                                        <Text style={styles.summaryValueBalance}>KSh {profile.feeDetails?.remainingBalance?.toLocaleString() || '0'}</Text>
                                    </View>

                                    {profile.feeDetails?.notes && (
                                        <Text style={styles.feeNotes}>
                                            <Ionicons name="information-circle-outline" size={14} color="#757575" /> {profile.feeDetails.notes}
                                        </Text>
                                    )}

                                    {/* Payment History Section with Generate Receipt button */}
                                    {profile.paymentHistory && profile.paymentHistory.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                                <Ionicons name="time-outline" size={24} color="#388E3C" /> Payment History
                                            </Text>
                                            <View style={styles.paymentHistoryContainer}>
                                                {profile.paymentHistory.map((payment, index) => (
                                                    <View key={index} style={styles.paymentItem}>
                                                        <View style={styles.paymentDetailsLeft}>
                                                            <Text style={styles.paymentDate}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
                                                            <Text style={styles.paymentAmount}>KSh {payment.amountPaid.toLocaleString()}</Text>
                                                        </View>
                                                        <View style={styles.paymentDetailsRight}>
                                                            <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
                                                            {payment.transactionReference && (
                                                                <Text style={styles.paymentReference}>Ref: {payment.transactionReference}</Text>
                                                            )}
                                                            <TouchableOpacity
                                                                style={styles.generateReceiptButton}
                                                                onPress={() => handleGenerateReceipt(payment._id, payment.transactionReference)}
                                                            >
                                                                <Ionicons name="receipt-outline" size={16} color="#fff" />
                                                                <Text style={styles.generateReceiptButtonText}>Receipt</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                    {profile.paymentHistory && profile.paymentHistory.length === 0 && (
                                        <Text style={styles.noHistoryText}>No payment history recorded yet.</Text>
                                    )}

                                </View>
                            )}
                        />
                    ) : (
                        // Display list of students if no detailed profile is active
                        <>
                            {!loading && filteredStudents.length > 0 && searchQuery.length > 0 && (
                                <View style={styles.searchResultsInfo}>
                                    <Text style={styles.searchResultsText}>Found {filteredStudents.length} matching students:</Text>
                                </View>
                            )}
                            {!loading && filteredStudents.length === 0 && searchQuery.length > 0 && (
                                <View style={styles.noResultsCard}>
                                    <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                                    <Text style={styles.noResultsText}>No student found matching "{searchQuery}". Please verify.</Text>
                                </View>
                            )}
                            {!loading && filteredStudents.length > 0 && ( // Show all students if no search query
                                <FlatList
                                    data={filteredStudents}
                                    keyExtractor={(item) => item._id}
                                    renderItem={renderStudentListItem}
                                    contentContainerStyle={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}
                             {!loading && allStudents.length === 0 && searchQuery.length === 0 && (
                                <View style={styles.noResultsCard}>
                                    <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                                    <Text style={styles.noResultsText}>No students recorded yet.</Text>
                                </View>
                            )}
                        </>
                    )}
                </KeyboardAvoidingView>
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
        backgroundColor: '#F0F8F6',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 15,
        textAlign: 'center',
    },
    searchCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 5,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    listItemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    listItemDetails: {
        flex: 1,
    },
    listItemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A5319',
    },
    listItemDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    profileListContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    closeProfileButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
        padding: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#388E3C',
        marginTop: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        flex: 1.5,
        textAlign: 'right',
    },
    noInfoText: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    feeItemsContainer: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#F9F9F9',
    },
    feeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EBEBEB',
    },
    feeItemName: {
        fontSize: 14,
        color: '#444',
    },
    feeItemAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paidRow: {
        borderTopWidth: 0, // No double border
    },
    balanceRow: {
        borderTopWidth: 1,
        borderTopColor: '#A5D6A7', // Greenish border for balance
    },
    summaryValuePaid: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32', // Darker green for paid amount
    },
    summaryValueBalance: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D32F2F', // Red for remaining balance
    },
    feeNotes: {
        fontSize: 13,
        color: '#757575',
        fontStyle: 'italic',
        marginTop: 15,
        paddingHorizontal: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#A5D6A7',
        paddingLeft: 10,
    },
    paymentHistoryContainer: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#F9F9F9',
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EBEBEB',
    },
    paymentDetailsLeft: {
        flex: 2,
    },
    paymentDetailsRight: {
        flex: 1.5,
        alignItems: 'flex-end',
    },
    paymentDate: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    paymentAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 2,
    },
    paymentMethod: {
        fontSize: 13,
        color: '#757575',
        fontStyle: 'italic',
    },
    paymentReference: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    generateReceiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1976D2', // A blue for action
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    generateReceiptButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    noResultsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    noResultsText: {
        fontSize: 16,
        color: '#616161',
        textAlign: 'center',
        marginTop: 10,
    },
    searchResultsInfo: {
        marginHorizontal: 20,
        marginBottom: 10,
        marginTop: 10,
        padding: 10,
        backgroundColor: '#E8F5E9',
        borderRadius: 10,
    },
    searchResultsText: {
        fontSize: 14,
        color: '#388E3C',
        fontWeight: 'bold',
    },
});
