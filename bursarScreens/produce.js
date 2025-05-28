import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const ProcessProduce = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [pendingValuations, setPendingValuations] = useState([]);
  const [valuationMap, setValuationMap] = useState({});

  useEffect(() => {
    fetchPendingValuationsData();
  }, []);

  const fetchPendingValuationsData = async () => {
    setPendingValuations([
      { id: 'p1', parentName: 'Charlie Brown', produce: '3 Bags Beans', marketRate: 3000 },
      { id: 'p2', parentName: 'Diana Miller', produce: '1 Truck Firewood', marketRate: 10000 },
      { id: 'p3', parentName: 'Lucy Van Pelt', produce: '5 Sacks Millet', marketRate: 1500 },
    ]);
    const initialValuationMap = {};
    [...pendingValuations].forEach(item => {
      initialValuationMap[item.id] = '';
    });
    setValuationMap(initialValuationMap);
  };

  const handleValueChange = (id, value) => {
    setValuationMap({ ...valuationMap, [id]: value });
  };

  const handleProcessValuation = async (item) => {
    const assignedValue = valuationMap[item.id];
    if (!assignedValue || isNaN(parseFloat(assignedValue))) {
      alert('Please enter a valid value for the produce.');
      return;
    }
    console.log('Processing Produce:', {
      valuationId: item.id,
      assignedValue,
    });
    const updatedValuations = pendingValuations.filter(val => val.id !== item.id);
    setPendingValuations(updatedValuations);
  };

  const renderItem = ({ item }) => (
    <View style={styles.produceItem}>
      <Text style={styles.parentName}>{item.parentName}</Text>
      <Text style={styles.produceDetails}>{item.produce}</Text>
      <Text style={styles.marketRate}>Market Rate: KES {item.marketRate}</Text>
      <TextInput
        style={styles.valueInput}
        placeholder="Assign Value (KES)"
        keyboardType="numeric"
        value={valuationMap[item.id]}
        onChangeText={(text) => handleValueChange(item.id, text)}
      />
      <TouchableOpacity style={styles.processButton} onPress={() => handleProcessValuation(item)}>
        <Text style={styles.processButtonText}>Process</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Process Farm Produce</Text>
      {pendingValuations.length > 0 ? (
        <FlatList
          data={pendingValuations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text>No produce currently awaiting valuation.</Text>
      )}
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  produceItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  produceDetails: {
    fontSize: 16,
    color: '#777',
    marginBottom: 5,
  },
  marketRate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  processButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  processButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProcessProduce;