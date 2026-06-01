import { Modal, Pressable, StyleSheet, Text as RNText, View } from 'react-native';

import { calendarsUIColors } from '@constants/calendarsUI';

interface Props {
  visible: boolean;
  calendarName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCalendarConfirmModal({ visible, calendarName, onCancel, onConfirm }: Props) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <RNText style={styles.title}>Delete {calendarName}?</RNText>
          <RNText style={styles.body}>
            This will remove all events and members. This can't be undone.
          </RNText>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <RNText style={styles.cancelText}>Cancel</RNText>
            </Pressable>
            <Pressable style={[styles.btn, styles.deleteBtn]} onPress={onConfirm}>
              <RNText style={styles.deleteText}>Delete</RNText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: calendarsUIColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: calendarsUIColors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: calendarsUIColors.surfaceHover,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: calendarsUIColors.text },
  deleteBtn: { backgroundColor: calendarsUIColors.danger },
  deleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
