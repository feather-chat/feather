import { View, Text, Pressable, Modal } from 'react-native';

interface NewChannelActionsProps {
  visible: boolean;
  onDismiss: () => void;
  onCreateChannel: () => void;
  onBrowseChannels: () => void;
}

export function NewChannelActions({
  visible,
  onDismiss,
  onCreateChannel,
  onBrowseChannels,
}: NewChannelActionsProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onDismiss}>
        <Pressable className="rounded-t-2xl bg-white pb-8 dark:bg-neutral-800">
          <View className="items-center py-2">
            <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </View>

          <ActionButton
            label="Create Channel"
            onPress={() => {
              onDismiss();
              onCreateChannel();
            }}
          />
          <ActionButton
            label="Browse Channels"
            onPress={() => {
              onDismiss();
              onBrowseChannels();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      className="px-6 py-3.5 active:bg-neutral-100 dark:active:bg-neutral-700"
      onPress={onPress}
    >
      <Text className="text-base text-neutral-900 dark:text-white">{label}</Text>
    </Pressable>
  );
}
