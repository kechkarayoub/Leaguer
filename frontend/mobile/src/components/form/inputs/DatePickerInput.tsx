import React, { useState } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../../contexts/ThemeContext';

interface DatePickerInputProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({ label, value, onChange, minimumDate, maximumDate, placeholder, error, required }) => {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(selectedDate);
  };

  const formatted = value ? value.toISOString().split('T')[0] : '';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      </View>
      <TouchableOpacity
        style={[styles.box, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, { color: value ? colors.text : colors.textSecondary }]}>
          {value ? formatted : (placeholder || label)}
        </Text>
      </TouchableOpacity>
      {!!error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide">
          <View style={styles.iosModalOverlay}>
            <View style={[styles.iosModalCard, { backgroundColor: colors.surface }]}> 
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                value={value || new Date()}
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
              <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(false)}>
                <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={value || new Date()}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  box: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14 },
  valueText: { fontSize: 16 },
  errorText: { fontSize: 12, marginTop: 4 },
  iosModalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'flex-end' },
  iosModalCard: { borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 },
  doneBtn: { marginTop: 8, alignSelf:'flex-end' },
  doneText: { fontSize:16, fontWeight:'600' },
});

export default DatePickerInput;
