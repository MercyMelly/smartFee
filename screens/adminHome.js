import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Assuming you're using React Navigation
import Icon from 'react-native-vector-icons/FontAwesome'; // Example icon library
import { PieChart } from 'react-native-chart-kit'; // Example charting library (you might need to install this)

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [financialSummary, setFinancialSummary] = useState({
    totalFeesCollected: 150000,
    pendingFees: 50000,
    produceValue: 15000,
  }); // Sample data
  const [studentStats, setStudentStats] = useState({
    totalStudents: 300,
    fullyPaid: 200,
    partiallyPaid: 80,
    unpaid: 20,
  }); // Sample data

  useEffect(() => {
    // Replace with actual API calls to fetch data
    fetchFinancialSummary();
    fetchStudentStats();
  }, []);

  const fetchFinancialSummary = async () => {
    // Simulate API call
    // const data = await fetch('/api/financial-summary');
    // const summary = await data.json();
    // setFinancialSummary(summary);
  };

  const fetchStudentStats = async () => {
    // Simulate API call
    // const data = await fetch('/api/student-stats');
    // const stats = await data.json();
    // setStudentStats(stats);
  };

  const feeStatusData = [
    { name: 'Fully Paid', population: studentStats.fullyPaid, color: 'green', legendFontColor: '#7F7F7F', legendFontSize: 15 },
    { name: 'Partially Paid', population: studentStats.partiallyPaid, color: 'orange', legendFontColor: '#7F7F7F', legendFontSize: 15 },
    { name: 'Unpaid', population: studentStats.unpaid, color: 'red', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  ];

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
      </View>

      {/* Financial Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Total Fees Collected:</Text>
          <Text style={styles.overviewValue}>KES {financialSummary.totalFeesCollected}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Pending Fees:</Text>
          <Text style={styles.overviewValue}>KES {financialSummary.pendingFees}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Value of Produce Received:</Text>
          <Text style={styles.overviewValue}>KES {financialSummary.produceValue}</Text>
        </View>
      </View>

      {/* Student Fee Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Fee Status</Text>
        {studentStats.totalStudents > 0 ? (
          <PieChart
            data={feeStatusData}
            width={300}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            style={{ alignSelf: 'center' }}
          />
        ) : (
          <Text>No student data available.</Text>
        )}
        <View style={styles.legendContainer}>
          {feeStatusData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name} ({item.population})</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Management Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <TouchableOpacity style={styles.managementButton}>
          <Icon name="users" size={20} color="green" style={styles.buttonIcon} />
          <Text style={styles.managementButtonText}>Manage Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.managementButton}>
          <Icon name="cog" size={20} color="green" style={styles.buttonIcon} />
          <Text style={styles.managementButtonText}>System Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.managementButton}>
          <Icon name="file-alt" size={20} color="green" style={styles.buttonIcon} />
          <Text style={styles.managementButtonText}>Generate Reports</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDate: {
    fontSize: 16,
    color: '#777',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  overviewLabel: {
    fontSize: 16,
    color: '#555',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: '#777',
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonIcon: {
        marginRight: 10,
  },
  managementButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AdminDashboard;