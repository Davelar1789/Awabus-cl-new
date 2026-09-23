import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Menu } from 'lucide-react-native';
import { router, useNavigation } from 'expo-router';
import { colors } from '../../lib/theme.js';

// Standard navy app-bar. `back` shows a back arrow instead of the hamburger.
export default function Header({ title, back = false, right }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleMenuPress = () => {
    if (back) {
      router.back();
      return;
    }
    // Walk up the navigator tree to find the Drawer, however deeply this
    // screen is nested inside it (a section's own Stack, etc).
    let nav = navigation;
    while (nav) {
      if (typeof nav.toggleDrawer === 'function') {
        nav.toggleDrawer();
        return;
      }
      nav = nav.getParent?.();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable onPress={handleMenuPress} style={styles.iconButton} hitSlop={10}>
        {back ? <ArrowLeft size={22} color={colors.white} /> : <Menu size={22} color={colors.white} />}
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right || (
        <View style={styles.iconButton}>
          <Bell size={22} color={colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
