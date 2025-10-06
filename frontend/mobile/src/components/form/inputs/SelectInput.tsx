import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

export interface SelectOption<T = string> { label: string; value: T }

interface SelectInputProps<T = string> {
  label: string;
  placeholder?: string;
  value: T | null;
  options: Array<SelectOption<T>>;
  onChange: (val: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const SelectInput = <T extends string | number = string>({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  required,
  disabled,
}: SelectInputProps<T>) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      </View>
      <TouchableOpacity
        disabled={disabled}
        style={( [
          styles.selector,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            opacity: disabled ? 0.6 as number : 1 as number,
          },
        ]) as any}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, { color: selected ? colors.text : colors.textSecondary }]}>
          {selected ? selected.label : (placeholder || label)}
        </Text>
      </TouchableOpacity>
      {!!error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  selector: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14 },
  valueText: { fontSize: 16 },
  errorText: { fontSize: 12, marginTop: 4 },
  backdrop: { flex:1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent:'center', padding:24 },
  modalCard: { maxHeight:'60%', borderRadius:12, paddingVertical:8 },
  optionRow: { paddingHorizontal:16, paddingVertical:14 },
  optionText: { fontSize:16 },
});

export default SelectInput;
