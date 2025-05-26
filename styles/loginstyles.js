import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
container: {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 30,
  backgroundColor: '#fff',
},

title: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#6a5acd',
  textAlign: 'center',
  marginBottom: 40,
},
input: { 
  borderWidth: 1,
  borderColor: '#ddd',
  backgroundColor: '#f9f9f9',
  padding: 15,
  borderRadius: 25,
  marginBottom: 20,
},
button: {
  backgroundColor: '#ffb6c1', 
  padding: 15,
  borderRadius: 25,
  alignItems: 'center',
  marginBottom: 15,
},
buttonText: {
  color: '#fff',
  fontWeight: 'bold',
},
link: {
  color: '#6a5acd', 
  textAlign: 'center',
  marginTop: 10,
},
});

export default styles;
