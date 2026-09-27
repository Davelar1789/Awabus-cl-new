import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BellOff, Info, UploadCloud } from 'lucide-react-native';
import Header from '../../../src/components/layout/Header.jsx';
import Card from '../../../src/components/ui/Card.jsx';
import { PageLoader } from '../../../src/components/ui/Spinner.jsx';
import { getNotifications } from '../../../src/api/driverApp.js';
import { useOfflineQueueStore } from '../../../src/store/offlineQueueStore.js';
import { useUiStore } from '../../../src/store/uiStore.js';
import { formatDateTime } from '../../../src/lib/utils.js';
import { colors } from '../../../src/lib/theme.js';

const LOOK = {
  danger: { Icon: AlertTriangle, color: colors.red600, bg: colors.red50 },
  warning: { Icon: AlertTriangle, color: colors.amber800, bg: colors.amber50 },
  info: { Icon: Info, color: colors.navy, bg: colors.brand50 },
  queue: { Icon: UploadCloud, color: colors.navy, bg: colors.slate100 },
};

export default function Notifications() {
  const { data, isLoading, isRefetching, refetch, isError, error } = useQuery({
    queryKey: ['driver-notifications'],
    queryFn: getNotifications,
  });
  const waiting = useOfflineQueueStore((s) => s.queue.length);

  // Opening this screen counts as having seen everything in it.
  useFocusEffect(
    useCallback(() => {
      const newest = data?.[0]?.at ? new Date(data[0].at).getTime() : 0;
      if (newest > (useUiStore.getState().notificationsSeenAt || 0)) useUiStore.getState().setPref('notificationsSeenAt', newest);
    }, [data])
  );

  const items = [
    ...(waiting
      ? [
          {
            id: 'queue',
            type: 'queue',
            title: `${waiting} update${waiting === 1 ? '' : 's'} waiting to send`,
            message: 'They were saved on this phone while it was offline and are sent automatically when the connection is back.',
          },
        ]
      : []),
    ...(data || []),
  ];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Notifications" right={<View style={{ width: 36 }} />} />
      {isLoading ? (
        <PageLoader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={isError ? <Text style={styles.error}>Couldn't load notifications: {error.message}</Text> : null}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <BellOff size={28} color={colors.slate300} />
              <Text style={styles.emptyTitle}>Nothing new</Text>
              <Text style={styles.emptyText}>
                You'll see licence reminders, bus changes, trips ended for you and delay texts that failed here.
              </Text>
            </Card>
          }
          renderItem={({ item }) => {
            const look = LOOK[item.type] || LOOK.info;
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: look.bg }]}>
                    <look.Icon size={16} color={look.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    {item.at ? <Text style={styles.time}>{formatDateTime(item.at)}</Text> : null}
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, flexGrow: 1 },
  card: { padding: 14 },
  row: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: colors.slate800 },
  message: { marginTop: 2, fontSize: 13, color: colors.slate500, lineHeight: 18 },
  time: { marginTop: 6, fontSize: 12, color: colors.slate400 },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontWeight: '800', color: colors.slate800, fontSize: 15 },
  emptyText: { color: colors.slate500, fontSize: 13, textAlign: 'center' },
  error: { color: colors.red600, marginBottom: 8 },
});
