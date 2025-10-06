import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import { useTheme } from '../../../contexts/ThemeContext';

interface ImagePickerInputProps {
  label: string;
  value: Asset | null;
  onChange: (asset: Asset | null) => void;
  required?: boolean;
  error?: string;
}

const ImagePickerInput: React.FC<ImagePickerInputProps> = ({ label, value, onChange, required, error }) => {
  const { colors } = useTheme();

  const openPicker = () => {
    Alert.alert(label, 'Choose an option', [
      { text: 'Camera', onPress: () => handleCamera() },
      { text: 'Library', onPress: () => handleLibrary() },
      { text: 'Remove', style: 'destructive', onPress: () => onChange(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLibrary = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (!res.didCancel && res.assets && res.assets[0]) {
        onChange(res.assets[0]);
      }
    } finally { /* no-op */ }
  };

  const handleCamera = async () => {
    try {
      const res = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      if (!res.didCancel && res.assets && res.assets[0]) {
        onChange(res.assets[0]);
      }
    } finally { /* no-op */ }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      </View>
      <TouchableOpacity
        onPress={openPicker}
        style={[styles.box, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }]}
        activeOpacity={0.8}
      >
        {value?.uri ? (
          <Image source={{ uri: value.uri }} style={styles.image} />
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Tap to select image</Text>
        )}
      </TouchableOpacity>
      {!!error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  box: { borderWidth: 1, borderRadius: 8, padding: 8, justifyContent:'center', alignItems:'center', height:140 },
  placeholder: { fontSize: 14 },
  errorText: { fontSize: 12, marginTop: 4 },
  image: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'cover' },
});

export default ImagePickerInput;
