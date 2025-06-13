import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://10.71.114.108:3000/api'; // Your backend API base URL

export default function AddStudent({ navigation }) {
  // Student State
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [gender, setGender] = useState(''); // <--- ADDED THIS LINE
  const [boardingStatus, setBoardingStatus] = useState('');
  const [hasTransport, setHasTransport] = useState(false);
  const [transportRoute, setTransportRoute] = useState('');

  // Parent State
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  const [loading, setLoading] = useState(false);

  const ALL_VALID_GRADES = [
    "", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
    "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
    "Grade 10", "Grade 11", "Grade 12"
  ];
  const ALL_VALID_ROUTES = [
    "", "Senetwo", "Maraba", "Songhor", "Kamelilo",
  ];

  useEffect(() => {
    if (!gradeLevel && ALL_VALID_GRADES.length > 1) {
      setGradeLevel(ALL_VALID_GRADES[1]);
    }
    if (!boardingStatus) {
      setBoardingStatus('Day');
    }
    // Initialize gender if it's not set
    if (!gender) {
        setGender(''); // Default to empty string for "Select Gender" option
    }
  }, []);

  const handleAddStudent = async () => {
    // Ensure gender is included in the validation check for required fields
    if (!fullName || !admissionNumber || !gradeLevel || !gender || !boardingStatus || !parentName || !parentPhone) {
      Alert.alert('Missing Information', 'Please fill in all *required* fields for student and parent (marked with *).');
      return;
    }

    setLoading(true);
    try {
      const studentData = {
        fullName,
        admissionNumber,
        gradeLevel,
        gender, // Now `gender` is properly defined
        boardingStatus,
        hasTransport: boardingStatus === 'Day' ? hasTransport : false,
        transportRoute: (boardingStatus === 'Day' && hasTransport) ? transportRoute : '',
        parentName,
        parentPhone,
        parentEmail,
        parentAddress,
      };

      const response = await axios.post(`${BASE_URL}/students/register`, studentData);

      Alert.alert('Success', `Student ${response.data.student.fullName} added successfully!`);
      // Reset form fields, including gender
      setFullName('');
      setAdmissionNumber('');
      setGradeLevel(ALL_VALID_GRADES[1]);
      setGender(''); // Reset gender state
      setBoardingStatus('Day');
      setHasTransport(false);
      setTransportRoute('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setParentAddress('');

    } catch (error) {
      console.error('Error adding student:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F0F8F6', '#E8F5E9']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Enroll New Student</Text>

            {/* Student Information Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="school-outline" size={24} color="#388E3C" /> Student Details
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#757575"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="Admission Number *"
                placeholderTextColor="#757575"
                value={admissionNumber}
                onChangeText={setAdmissionNumber}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Grade Level: *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={gradeLevel}
                  style={styles.picker}
                  onValueChange={(itemValue) => setGradeLevel(itemValue)}
                >
                  <Picker.Item label="Select Grade" value="" enabled={false} style={{ color: '#757575' }} />
                  {ALL_VALID_GRADES.slice(1).map((grade) => (
                    <Picker.Item key={grade} label={grade} value={grade} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Gender: *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={gender}
                  style={styles.picker}
                  onValueChange={(itemValue) => setGender(itemValue)}
                >
                  <Picker.Item label="Select Gender" value="" enabled={false} style={{ color: '#757575' }} />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                </Picker>
              </View>

              <Text style={styles.label}>Boarding Status: *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={boardingStatus}
                  style={styles.picker}
                  onValueChange={(itemValue) => {
                    setBoardingStatus(itemValue);
                    if (itemValue === 'Boarding' || itemValue === '') {
                      setHasTransport(false);
                      setTransportRoute('');
                    }
                  }}
                >
                  <Picker.Item label="Select Status" value="" enabled={false} style={{ color: '#757575' }} />
                  <Picker.Item label="Day" value="Day" />
                  <Picker.Item label="Boarding" value="Boarding" />
                </Picker>
              </View>

              {boardingStatus === 'Day' && (
                <>
                  <Text style={styles.label}>Uses School Transport?</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={hasTransport}
                      style={styles.picker}
                      onValueChange={(itemValue) => {
                        setHasTransport(itemValue);
                        if (!itemValue) {
                          setTransportRoute('');
                        }
                      }}
                    >
                      <Picker.Item label="No" value={false} />
                      <Picker.Item label="Yes" value={true} />
                    </Picker>
                  </View>

                  {hasTransport && (
                    <>
                      <Text style={styles.label}>Transport Route:</Text>
                      <View style={styles.pickerWrapper}>
                        <Picker
                          selectedValue={transportRoute}
                          style={styles.picker}
                          onValueChange={(itemValue) => setTransportRoute(itemValue)}
                        >
                          <Picker.Item label="Select Route" value="" enabled={false} style={{ color: '#757575' }} />
                          {ALL_VALID_ROUTES.slice(1).map((route) => (
                            <Picker.Item key={route} label={route} value={route} />
                          ))}
                        </Picker>
                      </View>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Parent Information Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="people-outline" size={24} color="#388E3C" /> Parent/Guardian Details
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Parent/Guardian Full Name *"
                placeholderTextColor="#757575"
                value={parentName}
                onChangeText={setParentName}
              />
              <TextInput
                style={styles.input}
                placeholder="Parent/Guardian Phone *"
                placeholderTextColor="#757575"
                value={parentPhone}
                onChangeText={setParentPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Parent/Guardian Email (Optional)"
                placeholderTextColor="#757575"
                value={parentEmail}
                onChangeText={setParentEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Parent/Guardian Address (Optional)"
                placeholderTextColor="#757575"
                value={parentAddress}
                onChangeText={setParentAddress}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAddStudent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register Student</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1B5E20', // Primary Green
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Neutral
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
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
    borderColor: '#C8E6C9', // Secondary Green for border
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#333',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginTop: 5,
    marginBottom: 8,
    fontSize: 16,
    color: '#555', // Neutral dark grey
    fontWeight: '600',
  },
  pickerWrapper: {
    width: '100%',
    borderColor: '#A5D6A7', // Secondary Green
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#F8F8F8', // Neutral
    marginBottom: 15,
    overflow: 'hidden',
    height: 55,
    justifyContent: 'center',
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
  picker: {
    width: '100%',
    height: 55,
    color: '#333', // Neutral dark grey
  },
  button: {
    backgroundColor: '#4CAF50', // Secondary Green for the button
    padding: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonText: {
    color: '#fff', // White text on button
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});