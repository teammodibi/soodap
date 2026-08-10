import React, { useEffect, useState, useRef } from 'react';
import { Modal, Pressable, Animated, StyleSheet, View } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { AlertConfig, subscribeAlert, hideAlert } from '../lib/alertStore';

export function CustomAlertModal() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    return subscribeAlert((newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.92, duration: 150, useNativeDriver: true }),
        ]).start(() => {
          setConfig(null);
        });
      }
    });
  }, [fadeAnim, scaleAnim]);

  if (!config) return null;

  const type = config.type || 'info';

  const typeStyles = {
    success: { bg: '#E8FFF1', iconColor: '#10B981', icon: 'checkmark-circle' as const },
    error: { bg: '#FEF2F2', iconColor: '#EF4444', icon: 'alert-circle' as const },
    warning: { bg: '#FFFBEB', iconColor: '#F59E0B', icon: 'warning' as const },
    confirm: { bg: '#EEF2FF', iconColor: '#6366F1', icon: 'help-circle' as const },
    info: { bg: '#FFF4ED', iconColor: '#FF5722', icon: 'information-circle' as const },
  }[type];

  const handleButtonPress = (onPress?: () => void) => {
    hideAlert();
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 50);
    }
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => hideAlert()}>
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(9, 9, 11, 0.45)',
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => hideAlert()} />
        </Animated.View>

        {/* Modal Container */}
        <View style={styles.centerContainer} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.alertCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <YStack ai="center" p={24} gap={14}>
              {/* Badge Icon */}
              <View style={[styles.iconContainer, { backgroundColor: typeStyles.bg }]}>
                <Ionicons name={typeStyles.icon} size={32} color={typeStyles.iconColor} />
              </View>

              {/* Text Info */}
              <YStack ai="center" gap={6} px={4}>
                <Text
                  fontFamily="Geist_700Bold"
                  fontSize={17}
                  color="#18181B"
                  textAlign="center"
                  lineHeight={22}
                >
                  {config.title}
                </Text>
                {!!config.message && (
                  <Text
                    fontFamily="Geist_400Regular"
                    fontSize={13.5}
                    color="#71717A"
                    textAlign="center"
                    lineHeight={19}
                  >
                    {config.message}
                  </Text>
                )}
              </YStack>

              {/* Action Buttons */}
              <XStack w="100%" gap={10} mt={10} jc="center">
                {config.buttons?.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';

                  let btnBg = '#FF5722';
                  let btnColor = 'white';
                  let btnBorder = 'transparent';

                  if (isDestructive) {
                    btnBg = '#EF4444';
                    btnColor = 'white';
                  } else if (isCancel) {
                    btnBg = '#F4F4F5';
                    btnColor = '#52525B';
                    btnBorder = '#E4E4E7';
                  }

                  return (
                    <Button
                      key={index}
                      f={config.buttons && config.buttons.length > 1 ? 1 : undefined}
                      px={config.buttons && config.buttons.length > 1 ? undefined : 28}
                      h={44}
                      borderRadius={12}
                      backgroundColor={btnBg}
                      borderWidth={isCancel ? 1 : 0}
                      borderColor={btnBorder}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => handleButtonPress(btn.onPress)}
                    >
                      <Text
                        fontFamily="Geist_700Bold"
                        fontSize={14}
                        color={btnColor}
                      >
                        {btn.text}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>
            </YStack>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
