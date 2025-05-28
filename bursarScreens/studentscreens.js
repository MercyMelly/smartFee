import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

const StudentScreen = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetch('http://localhost:3000/api/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setFilteredStudents(data);
      })
      .catch(err => console.error('Error fetching students:', err));
  }, []);

  useEffect(() => {
    const filtered = students.filter(student => {
      const matchesName = student.fullName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesClass = selectedClass
        ? student.className === selectedClass
        : true;
      return matchesName && matchesClass;
    });
    setFilteredStudents(filtered);
  }, [search, selectedClass, students]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => navigation.navigate('StudentDetails', { student: item })}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.fullName}</Text>
        {item.balance > 0 && <Text style={styles.badgeRed}>Outstanding</Text>}
      </View>
      <Text style={styles.balance}>Class: {item.className}</Text>
      <Text style={styles.balance}>Balance: KES {item.balance}</Text>
    </TouchableOpacity>
  );

  const uniqueClasses = [...new Set(students.map(s => s.className))];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Students</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name"
        value={search}
        onChangeText={setSearch}
      />

      <Picker
        selectedValue={selectedClass}
        onValueChange={value => setSelectedClass(value)}
        style={styles.picker}
      >
        <Picker.Item label="All Classes" value="" />
        {uniqueClasses.map(cls => (
          <Picker.Item key={cls} label={cls} value={cls} />
        ))}
      </Picker>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
  },
  list: {
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  balance: {
    fontSize: 14,
    color: 'gray',
  },
  badgeRed: {
    backgroundColor: '#ff5252',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
});

export default StudentScreen;
