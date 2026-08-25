import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CLOSE_DISTANCE = 96;
const CLOSE_VELOCITY = 900;

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  accessibilityLabel: string;
  minHeight?: number;
  maxHeightRatio?: number;
};

export function BottomSheetModal({
  visible,
  onClose,
  children,
  accessibilityLabel,
  minHeight,
  maxHeightRatio = 0.8,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useSharedValue(0);

  const finishClose = useCallback(() => {
    translateY.value = 0;
    onClose();
  }, [onClose, translateY]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(windowHeight, { duration: 180 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [finishClose, translateY, windowHeight]);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY) {
        translateY.value = withTiming(windowHeight, { duration: 180 }, (finished) => {
          if (finished) runOnJS(finishClose)();
        });
        return;
      }

      translateY.value = withSpring(0, { damping: 22, stiffness: 240 });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal animationType="fade" onRequestClose={dismiss} transparent visible={visible}>
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityLabel={accessibilityLabel}
            className="absolute inset-0 bg-overlay"
            onPress={dismiss}
          />
          <Animated.View
            accessibilityViewIsModal
            className="overflow-hidden rounded-t-lg bg-surface"
            style={[
              animatedSheetStyle,
              {
                minHeight,
                maxHeight: windowHeight * maxHeightRatio,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <GestureDetector gesture={dragGesture}>
              <Animated.View
                accessibilityLabel="Kéo xuống để đóng"
                accessibilityRole="adjustable"
                className="h-8 items-center justify-center"
              >
                <View className="h-1 w-10 rounded-full bg-border" />
              </Animated.View>
            </GestureDetector>
            <View className="min-h-0 flex-1">{children}</View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
