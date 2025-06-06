import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://192.168.0.27:3000/api/students');
      const data = await res.json();
      setStudents(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text) return setFiltered(students);
    const filteredData = students.filter(s => s.name.toLowerCase().includes(text.toLowerCase()));
    setFiltered(filteredData);
  };

  const goToStudentProfile = (student) => {
    navigation.navigate('studentProfile', { studentId: student.id });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => goToStudentProfile(item)}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.detail}>Class: {item.class}</Text>
      <Text style={styles.detail}>Balance: UGX {item.balance.toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeA}>      
      <View style={styles.header}>
        <Text style={styles.title}>All Students</Text>
        <TouchableOpacity onPress={() => navigation.navigate('addStudent')}>
          <Icon name="plus" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBox}
        placeholder="Search by name..."
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#555',
  },
});

export default StudentList;
