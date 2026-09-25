import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii } from '../../lib/theme.js';

// Ghana-only phone input: fixed +233 prefix + 9-digit local number.
export default function PhoneInput({ value, onChange, error, placeholder = '55 123 4567', ...props }) {
  return (
    <View style={[styles.wrap, error && styles.wrapError]}>
      <Text style={styles.prefix}>+233</Text>
      <TextInput
        keyboardType="phone-pad"
        value={value}
        onChangeText={(text) => onChange?.(text.replace(/[^\d\s]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.slate400}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapError: {
    borderColor: colors.red500,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate700,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: colors.slate200,
    height: '100%',
    textAlignVertical: 'center',
    lineHeight: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.slate900,
  },
});
