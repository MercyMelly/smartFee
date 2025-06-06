import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const StudentProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { admissionNumber } = route.params;

  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const studentRes = await fetch(`http://192.168.0.27:3000/api/students/${admissionNumber}`);
      const studentData = await studentRes.json();
      setStudent(studentData);

      const paymentRes = await fetch(`http://192.168.0.27:3000/payments/student/${admissionNumber}`);
      const paymentData = await paymentRes.json();
      setPayments(paymentData);
    } catch (error) {
      console.error('Failed to fetch student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = student ? student.totalFees - totalPaid : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <Text>Student not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{student.name}</Text>
      <Text style={styles.detail}>Admission No: {student.admissionNumber}</Text>
      <Text style={styles.detail}>Class: {student.class}</Text>
      <Text style={styles.detail}>Status: {student.status}</Text>
      <Text style={styles.detail}>Fee Category: {student.feeCategory}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Summary</Text>
        <Text style={styles.summary}>Total Fees: KES {student.totalFees}</Text>
        <Text style={styles.summary}>Paid: KES {totalPaid}</Text>
        <Text style={styles.outstanding}>Outstanding: KES {outstanding}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <Text>No payments yet.</Text>
        ) : (
          payments.map((p, index) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={styles.paymentDate}>{new Date(p.date).toLocaleDateString()}</Text>
              <Text style={styles.paymentAmount}>KES {p.amount}</Text>
              <Text style={styles.paymentMethod}>{p.method}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('makePayment', { admissionNumber })}
      >
        <Text style={styles.buttonText}>Make Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('editStudent', { student })}
      >
        <Icon name="edit" size={18} color="#333" />
        <Text style={styles.secondaryButtonText}>Edit Student</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    marginBottom: 6,
    color: '#555',
  },
  section: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summary: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  outstanding: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentDate: {
    flex: 2,
    color: '#777',
  },
  paymentAmount: {
    flex: 1,
    textAlign: 'right',
    color: '#2e7d32',
  },
  paymentMethod: {
    flex: 1,
    textAlign: 'right',
    color: '#777',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default StudentProfile;
