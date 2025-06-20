import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome'; // For the plus icon
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Define your API base URL
// IMPORTANT: Ensure this IP address is correct and accessible from your device!
const BASE_URL = 'https://300b-2c0f-fe38-2405-29ac-4d1a-39c4-f7e-d4b8.ngrok-free.app/api';

export default function StudentOverview() {
    const navigation = useNavigation();

    // State for search and loading
    const [searchQuery, setSearchQuery] = useState(''); // Unified search input
    const [loading, setLoading] = useState(false);

    // State for student data (all students and current profile)
    const [allStudents, setAllStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [currentStudentProfile, setCurrentStudentProfile] = useState(null);

    // Fetch all students on component mount and when the screen is focused
    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/students`);
            const data = await res.json();
            setAllStudents(data);
            setFilteredStudents(data); // Initially, filtered list is all students
        } catch (err) {
            console.error('Error fetching all students:', err);
            Alert.alert('Error', 'Failed to load student list. Please check your network and server.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to refetch data and reset state when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setCurrentStudentProfile(null); // Clear any displayed profile
            setSearchQuery(''); // Clear search input
            fetchAllStudents(); // Fetch the latest student list
        }, [fetchAllStudents])
    );

    // Handle unified search by name or admission number for the FlatList
    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text) {
            setFilteredStudents(allStudents); // If search is empty, show all students
            return;
        }
        const lowerCaseText = text.toLowerCase();
        const filteredData = allStudents.filter(s =>
            (s.fullName && s.fullName.toLowerCase().includes(lowerCaseText)) || // Corrected: use fullName
            (s.admissionNumber && s.admissionNumber.toLowerCase().includes(lowerCaseText))
        );
        setFilteredStudents(filteredData);
    };

    // Handle navigation/profile load from a student list item click
    const handleSelectStudentFromList = async (admissionNumber) => {
        if (!admissionNumber) {
            Alert.alert('Error', 'Student admission number is missing.');
            return;
        }
        setLoading(true);
        setCurrentStudentProfile(null); // Clear previous profile

        try {
            // Use admissionNumber for profile lookup, as per your backend routes
            const response = await axios.get(`${BASE_URL}/students/${admissionNumber}/profile`);
            setCurrentStudentProfile(response.data);
            setSearchQuery(''); // Clear search input when a profile is found
            setFilteredStudents([]); // Hide the list once a profile is selected
        } catch (error) {
            console.error('Error fetching student profile from list:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Failed to fetch student profile. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Generate Receipt functionality (unchanged)
    const handleGenerateReceipt = async (paymentId, transactionReference) => {
        try {
            Alert.alert('Generating Receipt', 'Please wait while we prepare your receipt...');
            const url = `${BASE_URL}/payments/generate-receipt/${paymentId}`;
            const fileName = `receipt_${transactionReference || paymentId}.pdf`;
            const downloadPath = FileSystem.documentDirectory + fileName;

            const { uri } = await FileSystem.downloadAsync(url, downloadPath, {
                headers: {
                    'Content-Type': 'application/pdf',
                },
            });

            Alert.alert('Receipt Downloaded!', `Receipt saved to: ${uri}`);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    UTI: 'com.adobe.pdf',
                    dialogTitle: 'Open Receipt',
                });
            } else {
                if (Platform.OS === 'ios') {
                    await WebBrowser.openBrowserAsync(uri);
                } else {
                    const contentUri = await FileSystem.getContentUriAsync(uri);
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        flags: 1,
                        type: 'application/pdf',
                    });
                }
            }
        } catch (error) {
            console.error('Error downloading/generating receipt:', error.response?.data || error.message || error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate receipt. Please try again.');
        }
    };

    // Render item for the FlatList (All Students)
    const renderStudentListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.listItemCard}
            // Use item.admissionNumber as the unique key for lookup
            onPress={() => handleSelectStudentFromList(item.admissionNumber)}
        >
            <View style={styles.listItemDetails}>
                <Text style={styles.listItemName}>{item.fullName || 'Name N/A'}</Text> {/* CORRECTED LINE */}
                <Text style={styles.listItemDetail}>Adm No: {item.admissionNumber || 'N/A'}</Text>
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
                        <Text style={styles.mainTitle}>Student Profile</Text>

                        {/* Unified Search Input for Name/Admission No */}
                        {!currentStudentProfile && ( // Only show search if no profile is active
                            <View style={styles.searchCard}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="search-outline" size={20} color="#757575" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Search by Name or Admission No."
                                        placeholderTextColor="#757575"
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                        autoCapitalize="words" // Capitalize first letter of each word
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

                    {/* Conditional Content: Loading, Profile, No Results, or Student List */}
                    {loading && (
                        <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 20 }} />
                    )}

                    {!loading && currentStudentProfile && (
                        // Student Profile Display Section
                        // Using FlatList for the profile to allow it to scroll if content is long
                        <FlatList
                            data={[currentStudentProfile]} // Wrap in array for FlatList
                            keyExtractor={(item) => item.student?.admissionNumber?.toString() || item.student?._id?.toString() || 'profile-key'}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.profileListContent}
                            renderItem={({ item: profile }) => ( // Renamed item to profile for clarity
                                <View style={styles.profileCard}>
                                    <TouchableOpacity onPress={() => setCurrentStudentProfile(null)} style={styles.closeProfileButton}>
                                        <Ionicons name="close-circle-outline" size={30} color="#D32F2F" />
                                    </TouchableOpacity>

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

                                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                        <Ionicons name="people-outline" size={24} color="#388E3C" /> Parent/Guardian
                                    </Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Name:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.parent?.name || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Phone:</Text>
                                        <Text style={styles.detailValue}>{profile.student?.parent?.phone || 'N/A'}</Text>
                                    </View>
                                    {profile.student?.parent?.email && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Email:</Text>
                                            <Text style={styles.detailValue}>{profile.student.parent.email}</Text>
                                        </View>
                                    )}
                                    {profile.student?.parent?.address && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Address:</Text>
                                            <Text style={styles.detailValue}>{profile.student.parent.address}</Text>
                                        </View>
                                    )}

                                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                        <Ionicons name="cash-outline" size={24} color="#388E3C" /> Fee Statement (Current Term)
                                    </Text>
                                    <View style={styles.feeItemsContainer}>
                                        {profile.feeDetails?.termlyComponents && profile.feeDetails.termlyComponents.map((item, index) => (
                                            <View key={index} style={styles.feeItem}>
                                                <Text style={styles.feeItemName}>{item.name}:</Text>
                                                <Text style={styles.feeItemAmount}>KSh {item.amount?.toLocaleString() || '0'}</Text>
                                            </View>
                                        ))}
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

                                    {profile.paymentHistory && profile.paymentHistory.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                                                <Ionicons name="time-outline" size={24} color="#388E3C" /> Payment History
                                            </Text>
                                            <View style={styles.paymentHistoryContainer}>
                                                {profile.paymentHistory.map((payment, index) => (
                                                    <View key={payment._id || index} style={styles.paymentItem}>
                                                        <View style={styles.paymentDetailsLeft}>
                                                            <Text style={styles.paymentDate}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
                                                            <Text style={styles.paymentAmount}>KSh {payment.amountPaid?.toLocaleString() || '0'}</Text>
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
                    )}

                    {!loading && !currentStudentProfile && filteredStudents.length === 0 && searchQuery && (
                        <View style={styles.noResultsCard}>
                            <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                            <Text style={styles.noResultsText}>No students found matching "{searchQuery}".</Text>
                        </View>
                    )}

                    {!loading && !currentStudentProfile && filteredStudents.length === 0 && !searchQuery && allStudents.length === 0 && (
                        <View style={styles.noResultsCard}>
                            <Ionicons name="information-circle-outline" size={50} color="#A5D6A7" />
                            <Text style={styles.noResultsText}>No students loaded. Check your server connection or add new students.</Text>
                        </View>
                    )}

                    {/* All Students List Section (shown when no profile is displayed) */}
                    {!loading && !currentStudentProfile && filteredStudents.length > 0 && (
                        <View style={styles.listSection}>
                            <View style={styles.listHeader}>
                                <Text style={styles.cardTitle}>Student Directory</Text> {/* Changed back to Directory */}
                                <TouchableOpacity onPress={() => navigation.navigate('addStudent')} style={styles.addButton}>
                                    <Icon name="plus" size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Add Student</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={filteredStudents}
                                // The keyExtractor should use a unique and stable identifier.
                                // Based on your backend, 'admissionNumber' is used for lookup.
                                // Ensure it's present for every student item.
                                keyExtractor={(item) => item.admissionNumber?.toString() || item._id?.toString() || Math.random().toString()}
                                renderItem={renderStudentListItem}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContentContainer} // Added for padding/margin specific to the list
                            />
                        </View>
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
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: '#F0F8F6', // Match background gradient top color
        // Add shadow/elevation to make it visually distinct if it's a fixed header
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 25,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    // --- Unified Search Card ---
    searchCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
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
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 15,
        textAlign: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#A5D6A7',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#F8F8F8',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 5,
    },

    // --- All Students List Section ---
    listSection: {
        flex: 1, // Allow FlatList to take available space
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20, // Add some bottom padding if needed
        marginHorizontal: 20, // Match header horizontal padding
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
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    addButton: {
        backgroundColor: '#2e7d32',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    listItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    listItemDetails: {
        flex: 1, // Take all available space
    },
    listItemName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    listItemDetail: {
        fontSize: 13,
        color: '#555',
    },
    listContentContainer: {
        paddingBottom: 20, // Add padding to the bottom of the list itself
    },
    // Removed listItemBalance, listItemBalanceLabel, listItemBalanceValue

    // --- Student Profile Display Card ---
    profileListContent: {
        flexGrow: 1, // Allow content to grow and scroll
        paddingBottom: 40, // Add padding at the bottom of the profile view
        paddingHorizontal: 20, // Match the padding of the header container
    },
    profileCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
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
        borderWidth: 1,
        borderColor: '#A5D6A7',
        position: 'relative',
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
        color: '#1B5E20',
        marginBottom: 15,
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8F5E9',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingBottom: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F8F6',
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    feeItemsContainer: {
        marginTop: 10,
    },
    feeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F8F6',
    },
    feeItemName: {
        fontSize: 16,
        color: '#555',
        flex: 1,
    },
    feeItemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#388E3C',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
    },
    summaryLabel: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    summaryValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    paidRow: {
        borderTopWidth: 0,
    },
    balanceRow: {
        borderTopWidth: 2,
        borderTopColor: '#1B5E20',
        paddingTop: 15,
        marginTop: 15,
    },
    summaryValuePaid: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#388E3C',
    },
    summaryValueBalance: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    feeNotes: {
        fontSize: 13,
        color: '#757575',
        marginTop: 15,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    paymentHistoryContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
        paddingTop: 10,
    },
    paymentItem: {
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#C8E6C9',
    },
    paymentDetailsLeft: {
        flex: 2,
        alignItems: 'flex-start',
    },
    paymentDetailsRight: {
        flex: 1.5,
        alignItems: 'flex-end',
    },
    paymentDate: {
        fontSize: 14,
        color: '#555',
    },
    paymentAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#388E3C',
        marginTop: 2,
    },
    paymentMethod: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
    },
    paymentReference: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    generateReceiptButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateReceiptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    noHistoryText: {
        fontSize: 14,
        color: '#757575',
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    noResultsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginTop: 20, // Add top margin
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9',
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
        marginHorizontal: 20, // Match padding
    },
    noResultsText: {
        fontSize: 16,
        color: '#555',
        marginTop: 10,
        textAlign: 'center',
    },
});