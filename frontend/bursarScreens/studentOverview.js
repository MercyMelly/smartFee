import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    FlatList,
    Platform,
    KeyboardAvoidingView,
    Modal, 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher'; // For Android intents
import { Buffer } from 'buffer'; 
import { BASE_URL } from '../config/index';


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

    // SMS Modal States
    const [isSmsModalVisible, setIsSmsModalVisible] = useState(false);
    const [smsMessage, setSmsMessage] = useState('');
    const [sendingSms, setSendingSms] = useState(false);


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
                timeout: 15000, // Add timeout for safety
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
            console.log("[StudentOverview] All students fetched and loading set to false."); // Debug log
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
        console.log(`[StudentOverview] Attempting to fetch profile for admission number: ${admissionNumber}`); // Debug log

        try {
            const config = {
                headers: {
                    'x-auth-token': token,
                },
                timeout: 15000, // Add timeout for safety
            };
            const response = await axios.get(`${BASE_URL}/students/${admissionNumber}/profile`, config);
            setCurrentStudentProfile(response.data); // Set the detailed profile
            console.log("[StudentOverview] Profile fetched successfully:", response.data.student?.fullName); // Debug log
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
                timeout: 30000, // Longer timeout for file downloads
            };

            const response = await axios.get(url, config);

            // Convert ArrayBuffer to Base64 (for React Native, this is how FileSystem expects it)
            // Note: If 'Buffer' is not defined, you might need to ensure your environment polyfills it
            // or use a different method to convert ArrayBuffer to Base64 string directly.
            // For Expo, ArrayBuffer -> Base64 might be direct if `response.data` is an ArrayBuffer
            // which can be written with FileSystem.EncodingType.Base64.
            const pdfBase64 = Buffer.from(response.data).toString('base64');


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
                // Fallback for devices that don't support Sharing
                if (Platform.OS === 'ios') {
                    // On iOS, can try opening directly with WebBrowser if Share isn't available
                    await WebBrowser.openBrowserAsync(downloadPath);
                } else {
                    // On Android, use IntentLauncher
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
            } else if (error.code === 'ECONNABORTED') {
                Alert.alert('Error', 'Request timed out while generating receipt. Please try again.');
            }
        }
    };

    // Handle sending custom SMS
    const handleSendCustomSms = useCallback(async () => {
        console.log("[StudentOverview] handleSendCustomSms called."); // Debug log
        console.log("[StudentOverview] currentStudentProfile (inside callback):", currentStudentProfile); // Debug log

        if (!token) {
            Alert.alert('Authentication Error', 'You are not logged in. Please log in to send SMS.');
            logout();
            return;
        }
        // FIX: Changed condition to use admissionNumber
        if (!currentStudentProfile || !currentStudentProfile.student?.admissionNumber) {
            Alert.alert('Error', 'No student selected to send SMS to or admission number is missing.');
            console.log("[StudentOverview] Debug: currentStudentProfile is null or missing student.admissionNumber."); // Updated log
            return;
        }
        if (!smsMessage.trim()) {
            Alert.alert('Error', 'Please enter a message to send.');
            return;
        }
        // Check for parent phone existence and format (if not already handled by schema validation)
        if (!currentStudentProfile.student?.parent?.phone) {
            Alert.alert('Error', `Parent phone number not available for ${currentStudentProfile.student?.fullName}.`);
            console.log("[StudentOverview] Debug: Parent phone number is missing."); // Debug log
            return;
        }

        setSendingSms(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                timeout: 15000,
            };
            const payload = {
                // FIX: Send admissionNumber to backend instead of _id
                admissionNumber: currentStudentProfile.student.admissionNumber, // Sending admissionNumber
                message: smsMessage.trim(),
            };
            console.log("[StudentOverview] Sending SMS payload:", payload); // Debug log

            const res = await axios.post(`${BASE_URL}/sms/send-to-parent`, payload, config);
            console.log('SMS Send Result:', res.data);
            Alert.alert('Success', res.data.msg || 'SMS sent successfully!');
            setIsSmsModalVisible(false); // Close modal on success
            setSmsMessage(''); // Clear message input
        } catch (error) {
            console.error('Error sending custom SMS:', error.response?.data || error.message);
            Alert.alert(
                'SMS Send Failed',
                error.response?.data?.msg || error.message || 'An unknown error occurred while sending SMS.'
            );
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                    { text: 'OK', onPress: logout }
                ]);
            } else if (error.code === 'ECONNABORTED') {
                Alert.alert('Error', 'Request timed out. Could not send SMS.');
            }
        } finally {
            setSendingSms(false);
        }
    }, [token, smsMessage, currentStudentProfile, logout]); // Dependencies are correct for currentStudentProfile


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
                            keyExtractor={(item) => item.student?._id?.toString() || 'profile-key'} // Use _id for keyExtractor as it's typically unique for React lists
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
                                                {/* Display the phone number, if it exists */}
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

                                    {/* SMS Button in Parent/Guardian section */}
                                    {/* Only show if a phone number exists */}
                                    {profile.student?.parent?.phone && (
                                        <TouchableOpacity
                                            style={styles.sendSmsButton}
                                            onPress={() => {
                                                console.log("[StudentOverview] 'Send Message to Parent' button pressed."); // Debug log
                                                setIsSmsModalVisible(true);
                                            }}
                                        >
                                            <Ionicons name="chatbox-outline" size={20} color="#fff" />
                                            <Text style={styles.sendSmsButtonText}>Send Message to Parent</Text>
                                        </TouchableOpacity>
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

            {/* SMS Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isSmsModalVisible}
                onRequestClose={() => setIsSmsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.smsModalContainer}>
                        <Text style={styles.smsModalTitle}>Send SMS to Parent</Text>
                        <Text style={styles.smsModalRecipient}>
                            To: {currentStudentProfile?.student?.fullName}'s Parent ({currentStudentProfile?.student?.parent?.phone})
                        </Text>
                        <TextInput
                            style={styles.smsInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Type your message here..."
                            value={smsMessage}
                            onChangeText={setSmsMessage}
                            maxLength={160} // Typical SMS character limit
                        />
                        <Text style={styles.smsCharCount}>{smsMessage.length}/160 characters</Text>
                        <View style={styles.smsModalButtons}>
                            <TouchableOpacity
                                style={[styles.smsModalButton, styles.smsModalCancelButton]}
                                onPress={() => { setIsSmsModalVisible(false); setSmsMessage(''); }}
                            >
                                <Text style={styles.smsModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.smsModalButton, styles.smsModalSendButton]}
                                onPress={handleSendCustomSms}
                                disabled={sendingSms || smsMessage.trim().length === 0}
                            >
                                {sendingSms ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.smsModalButtonText}>Send SMS</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        marginBottom: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 0, // Add padding for Android status bar
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 8,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A5319',
        textAlign: 'center',
        marginBottom: 15,
    },
    searchCard: {
        backgroundColor: '#F7F8FA',
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
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
        marginLeft: 10,
        padding: 5,
    },
    searchResultsInfo: {
        padding: 10,
        backgroundColor: '#E6F4EA',
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    searchResultsText: {
        fontSize: 15,
        color: '#1A5319',
        fontWeight: 'bold',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    listItemDetails: {
        flex: 1,
    },
    listItemName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    listItemDetail: {
        fontSize: 14,
        color: '#666',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    noResultsText: {
        fontSize: 16,
        color: '#616161',
        textAlign: 'center',
        marginTop: 10,
    },
    profileListContent: {
        paddingHorizontal: 20,
        paddingBottom: 40, // More padding for scrollable content
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        position: 'relative', // For close button positioning
    },
    closeProfileButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1, // Ensure it's clickable
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#388E3C',
        marginBottom: 15,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center title
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F0F0',
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
    sendSmsButton: { // Style for the new SMS button
        backgroundColor: '#1976D2', // Blue color
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    sendSmsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    feeItemsContainer: {
        marginBottom: 10,
    },
    feeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F0F0',
    },
    feeItemName: {
        fontSize: 15,
        color: '#444',
    },
    feeItemAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
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
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 10,
    },
    summaryValuePaid: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    balanceRow: {
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#FFCDD2',
    },
    summaryValueBalance: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    feeNotes: {
        fontSize: 13,
        color: '#757575',
        fontStyle: 'italic',
        marginTop: 10,
        textAlign: 'center',
    },
    paymentHistoryContainer: {
        marginTop: 10,
    },
    paymentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    paymentDetailsLeft: {
        flex: 1,
    },
    paymentDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentDetailsRight: {
        alignItems: 'flex-end',
    },
    paymentMethod: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    paymentReference: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    generateReceiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1976D2',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginTop: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    generateReceiptButtonText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
        fontWeight: 'bold',
    },
    noHistoryText: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },

    // NEW SMS Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
    },
    smsModalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    smsModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A5319',
        marginBottom: 15,
    },
    smsModalRecipient: {
        fontSize: 15,
        color: '#555',
        marginBottom: 15,
        textAlign: 'center',
    },
    smsInput: {
        width: '100%',
        minHeight: 80,
        borderColor: '#A5D6A7',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        textAlignVertical: 'top', // For multiline input to start from top
        marginBottom: 10,
        backgroundColor: '#F8F8F8',
    },
    smsCharCount: {
        alignSelf: 'flex-end',
        fontSize: 12,
        color: '#757575',
        marginBottom: 20,
    },
    smsModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    smsModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    smsModalSendButton: {
        backgroundColor: '#2E7D32', // Green
    },
    smsModalCancelButton: {
        backgroundColor: '#EF5350', // Red
    },
    smsModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
