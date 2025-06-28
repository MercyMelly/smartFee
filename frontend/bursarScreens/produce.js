import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/index';

// CRITICAL: Use BASE_URL from your config for all API calls
// const PRICE_API_ENDPOINT = `${BASE_URL}/prices`; // Corrected to use BASE_URL

const PRICE_API_ENDPOINT = 'https://0233-185-69-145-185.ngrok-free.app/api/prices';

// Hard-coded fallback prices (KSh per Kg)
const schoolSetPrices = {
    'firewood': 15000, 
    'beans': 140,
    'millet': 85,
    'white maize': 70,
    'sorghum': 70,
}; 

export default function ProcessProduce({ navigation, route }) {
    // Make county a state variable to ensure it's always defined
    const [county, setCounty] = useState(route.params?.county || 'Nandi'); 
    const [market, setMarket] = useState(route.params?.market || 'Chepterit Market - Nandi'); // Also make market a state for consistency

    const [admissionNumber, setAdmissionNumber] = useState('');
    const [inKindItemType, setInKindItemType] = useState('');
    const [inKindQuantity, setInKindQuantity] = useState('');
    const [transactionReference, setTransactionReference] = useState('');
    const [payerName, setPayerName] = useState(''); 
    const [notes, setNotes] = useState('');
    const [amountPaid, setAmountPaid] = useState(''); // This will be calculated
    const [pricePerKg, setPricePerKg] = useState(null);
    const [loading, setLoading] = useState(false); // For recording payment
    const [fetchingPrices, setFetchingPrices] = useState(false); // For fetching external prices

    const produceOptions = [
        'White Maize',
        'Millet',
        'Sorghum',
        'Beans',
        'Firewood'
    ];

    // Whenever commodity or quantity changes, fetch price
    useEffect(() => {
        const quantityNum = parseFloat(inKindQuantity);
        if (inKindItemType && !isNaN(quantityNum) && quantityNum > 0) { 
            fetchLatestPrice(inKindItemType);
        } else {
            setPricePerKg(null); // Clear price if no valid commodity/quantity
            setAmountPaid('');
        }
    }, [inKindItemType, inKindQuantity, county]); 

    const fetchLatestPrice = async (commodity) => {
        setFetchingPrices(true);
        try {
            const resp = await axios.get(PRICE_API_ENDPOINT, {
                params: { county: county, commodity } 
            });
            const data = resp.data;

            if (data.length > 0) {
                const marketData = data.find(item => item.market.toLowerCase().includes(market.toLowerCase())) || data[0];

                const wholesaleStr = marketData.wholesale; 
                const parsed = parseFloat(wholesaleStr.replace('/Kg', ''));
                if (!isNaN(parsed)) {
                    setPricePerKg(parsed);
                    const quantityNum = parseFloat(inKindQuantity);
                    if (!isNaN(quantityNum) && quantityNum > 0) {
                        const total = parsed * quantityNum * 90; // Assuming 90kg per bag
                        setAmountPaid(total.toFixed(2));
                    } else {
                        setAmountPaid(''); 
                    }
                } else {
                    fallbackPrice(commodity);
                }
            } else {
                fallbackPrice(commodity);
            }
        } catch (error) {
            console.error('Fetching price error:', error.response?.data || error.message);
            fallbackPrice(commodity, true);
        } finally {
            setFetchingPrices(false);
        }
    };

    const fallbackPrice = (commodity, isError = false) => {
        const fallback = schoolSetPrices[commodity.toLowerCase()];
        if (fallback) {
            Alert.alert(
                isError ? 'Error fetching market price' : 'Market Price Missing',
                `Using school-set price for ${commodity}. This might not be the latest market price.`
            );
            setPricePerKg(fallback);
            const quantityNum = parseFloat(inKindQuantity);
            if (!isNaN(quantityNum) && quantityNum > 0) {
                const total = fallback * quantityNum * 90; 
                setAmountPaid(total.toFixed(2));
            } else {
                setAmountPaid('');
            }
        } else {
            Alert.alert(
                'No Price Available',
                `No market price and no fallback price for ${commodity}. Cannot calculate value.`
            );
            setPricePerKg(null);
            setAmountPaid('');
        }
    };

    const handleRecordPayment = async () => {
        if (!admissionNumber.trim()) {
        return Alert.alert('Missing', 'Admission number is required.');
        }
        if (!inKindItemType || inKindItemType.trim() === "") {
        return Alert.alert('Missing', 'Please select a produce type.');
        }
        const quantityNum = parseFloat(inKindQuantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
        return Alert.alert('Invalid', 'Quantity must be a positive number.');
        }
        if (!transactionReference.trim()) {
        return Alert.alert('Missing', 'Internal reference is required.');
        }
        if (pricePerKg === null) {
        return Alert.alert('Missing Price', 'Cannot record payment. Price per Kg is not determined.');
        }
        if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
        return Alert.alert('Error', 'Calculated payment amount is invalid.');
        }
        setLoading(true);
        try {
            const paymentData = {
                admissionNumber,
                amountPaid: parseFloat(amountPaid),
                paymentMethod: 'In-Kind',
                transactionReference: transactionReference.trim(),
                payerName: payerName.trim() || undefined,
                notes: notes.trim() || undefined,
                inKindItemType,
                inKindQuantity: quantityNum,
                inKindUnitPrice: pricePerKg, // Direct use of pricePerKg (already parsed float)
                county, // Passed from state
                market // Passed from state
            };
            console.log("Submitting paymentData to server:", paymentData);
            const resp = await axios.post(`${BASE_URL}/payments/record-in-kind`, paymentData);            
            Alert.alert(
                'Success',
                `Recorded ${quantityNum} bags of ${inKindItemType}\nValue: KSh ${parseFloat(amountPaid).toLocaleString()}\nRemaining balance: KSh ${resp.data.updatedStudentBalance.remainingBalance.toLocaleString()}`
            );
            resetForm();
        } catch (error) {
            console.error('Error recording payment:', error.response?.data || error.message || error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to record payment. Check network connection and server logs.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAdmissionNumber('');
        setInKindItemType('');
        setInKindQuantity('');
        setTransactionReference('');
        setPayerName('');
        setNotes('');
        setAmountPaid('');
        setPricePerKg(null);
    };

    return (
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.container}>
                        <Text style={styles.title}>Record Produce Payment</Text>
                        <Text style={styles.subtitle}>Selected County: {county} | Market: {market}</Text> 

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="basket-outline" size={20} color="#388E3C" /> Produce Details
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Admission Number *"
                                value={admissionNumber}
                                onChangeText={setAdmissionNumber}
                                autoCapitalize="characters"
                            />

                            <Text style={styles.label}>Produce Type *</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={inKindItemType}
                                    onValueChange={setInKindItemType}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Produce" value="" />
                                    {produceOptions.map((item, i) => (
                                        <Picker.Item key={i} label={item} value={item} />
                                    ))}
                                </Picker>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Quantity (90kg bags) *"
                                value={inKindQuantity}
                                onChangeText={setInKindQuantity}
                                keyboardType="numeric"
                            />

                            {fetchingPrices ? (
                                <ActivityIndicator size="small" color="#388E3C" style={styles.priceLoader} />
                            ) : pricePerKg !== null ? (
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceText}>
                                        Price: KSh {pricePerKg.toFixed(2)} /kg (from {market})
                                    </Text>
                                    <Text style={styles.priceText}>
                                        Total Value: KSh {parseFloat(amountPaid).toLocaleString()}
                                    </Text>
                                </View>
                            ) : (inKindItemType && inKindQuantity && parseFloat(inKindQuantity) > 0) && (
                                <Text style={styles.priceErrorText}>No price available for calculation. Check connection or selected options.</Text>
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Internal Reference (e.g., GRN-001) *"
                                value={transactionReference}
                                onChangeText={setTransactionReference}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Payer Name (Optional)"
                                value={payerName}
                                onChangeText={setPayerName}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Notes (Optional)"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRecordPayment}
                            disabled={loading || fetchingPrices} 
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Record Produce Payment</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#388E3C', textAlign: 'center', marginBottom: 20 },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#388E3C',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#616161',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerWrapper: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    priceLoader: {
        marginVertical: 10,
    },
    priceContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    priceText: {
        color: '#2E7D32',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 5,
    },
    priceErrorText: {
        color: '#D32F2F',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#388E3C',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
