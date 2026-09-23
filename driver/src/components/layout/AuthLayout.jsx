import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bus } from 'lucide-react-native';
import { colors } from '../../lib/theme.js';

export default function AuthLayout({ children }) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.banner}>
        <View style={styles.logoRow}>
          <Bus size={30} color={colors.brand300} />
          <Text style={styles.wordmark}>AWABUS</Text>
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  banner: {
    height: 180,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.brand300,
    letterSpacing: 1,
  },
  body: {
    padding: 24,
    paddingBottom: 48,
  },
});
