import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ProcessProduceScreen = () => {
  const [parentName, setParentName] = useState('');
  const [produceType, setProduceType] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = () => {
    if (!parentName || !produceType || !quantity) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    // TODO: Save to backend or state
    console.log({ parentName, produceType, quantity });

    Alert.alert('Success', 'Produce submitted for valuation!');
    setParentName('');
    setProduceType('');
    setQuantity('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Process Produce Valuation</Text>

      <TextInput
        style={styles.input}
        placeholder="Parent Name"
        value={parentName}
        onChangeText={setParentName}
      />

      <TextInput
        style={styles.input}
        placeholder="Produce Type (e.g., Maize)"
        value={produceType}
        onChangeText={setProduceType}
      />

      <TextInput
        style={styles.input}
        placeholder="Quantity"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Produce</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProcessProduceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
