import React, { useState } from 'react';
import {  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const classes = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

const NewStudent = ({ navigation }) => {
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [gender, setGender] = useState('');
  const [boarding, setBoarding] = useState(false);
  const [transport, setTransport] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = () => {
    if (!name || !admissionNumber || !selectedClass || !gender) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const newStudent = {
      name,
      admissionNumber,
      class: selectedClass,
      gender,
      boarding,
      transport,
      phoneNumber,
    };

    console.log('New student data:', newStudent);
    Alert.alert('Success', 'Student registered successfully', [
    {
      text: 'OK',
      onPress: () =>
        navigation.navigate('studentProfile', { student: newStudent }),
    },
  ]);

    // Alert.alert('Success', 'Student registered successfully');
    // navigation.goBack(); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>

        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Register New Student</Text>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
        />

        <Text style={styles.label}>Admission Number *</Text>
        <TextInput
            style={styles.input}
            value={admissionNumber}
            onChangeText={setAdmissionNumber}
            placeholder="Enter admission number"
            keyboardType="numeric"
        />

        <Text style={styles.label}>Class *</Text>
        <View style={styles.classSelector}>
            {classes.map((cls) => (
            <TouchableOpacity
                key={cls}
                style={[
                styles.classButton,
                selectedClass === cls && styles.selectedClassButton,
                ]}
                onPress={() => setSelectedClass(cls)}
            >
                <Text
                style={[
                    styles.classButtonText,
                    selectedClass === cls && styles.selectedClassButtonText,
                ]}
                >
                {cls}
                </Text>
            </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.classSelector}>
            {['Male', 'Female'].map((g) => (
            <TouchableOpacity
                key={g}
                style={[
                styles.classButton,
                gender === g && styles.selectedClassButton,
                ]}
                onPress={() => setGender(g)}
            >
                <Text
                style={[
                    styles.classButtonText,
                    gender === g && styles.selectedClassButtonText,
                ]}
                >
                {g}
                </Text>
            </TouchableOpacity>
            ))}
        </View>
            <Text style={styles.label}>Parent's Phone Number *</Text>
            <TextInput
                style={styles.input}
                onChangeText={setPhoneNumber}
                placeholder="0712345678"
                keyboardType="numeric"
            />

        <View style={styles.checkboxContainer}>
            <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setBoarding(!boarding)}
            >
            <View style={[styles.checkboxBox, boarding && styles.checkedBox]} />
            <Text style={styles.checkboxLabel}>Boarding</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setTransport(!transport)}
            >
            <View style={[styles.checkboxBox, transport && styles.checkedBox]} />
            <Text style={styles.checkboxLabel}>Transport</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Register Student</Text>
        </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    flexGrow: 1,
  },
  title: {
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center',
  marginVertical: 20,
  color: '#2e7d32',
},
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  classSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  classButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedClassButton: {
    backgroundColor: '#2e7d32',
  },
  classButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  selectedClassButtonText: {
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
    borderRadius: 3,
  },
  checkedBox: {
    backgroundColor: '#2e7d32',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default NewStudent;
