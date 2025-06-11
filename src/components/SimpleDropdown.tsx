import React from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SimpleItem = {
  id: string;
  name: string;
};

type Props = {
  items: SimpleItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  position: { pageX: number; pageY: number; width: number; height: number };
  dark?: boolean;
};

const SimpleDropdown = React.memo(({ items, selectedId, onSelect, onClose, position, dark = false }: Props) => {
  const handleSelect = (id: string) => {
    setTimeout(() => {
      onSelect(id);
      onClose();
    }, 0);
  };

  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const dropdownWidth = position.width;
  const left = Math.min(position.pageX, screenWidth - dropdownWidth - 10);

  const rawTop = position.pageY + position.height;
  let topPos = rawTop;

  const estimatedHeight = Math.min(items.length * 44, 240);
  if (topPos + estimatedHeight > screenHeight - insets.bottom) {
    topPos = position.pageY - estimatedHeight;
  }
  if (topPos < insets.top) {
    topPos = insets.top + 8;
  }

  const colors = {
    background: dark ? 'rgba(30,30,47,0.95)' : '#fff',
    border: dark ? 'rgba(78,81,102,0.3)' : 'rgba(60,60,67,0.2)',
    itemBorder: dark ? 'rgba(78,81,102,0.3)' : 'rgba(60,60,67,0.1)',
    text: dark ? '#e0e0e0' : '#333',
    activeBg: dark ? '#4169E1' : '#007AFF',
    activeText: '#fff',
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View
        style={{
          position: 'absolute',
          top: topPos,
          left,
          width: dropdownWidth,
          backgroundColor: colors.background,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          maxHeight: 240,
          overflow: 'hidden',
          zIndex: 9999,
        }}>
        <ScrollView keyboardShouldPersistTaps="always">
          {items.map((it, idx) => (
            <TouchableOpacity
              key={it.id}
              style={[
                styles.item,
                { borderBottomColor: colors.itemBorder },
                selectedId === it.id && { backgroundColor: colors.activeBg },
                idx === items.length - 1 && { borderBottomWidth: 0 },
              ]}
              activeOpacity={0.7}
              onPress={() => handleSelect(it.id)}>
              <Text
                style={[
                  styles.itemText,
                  { color: selectedId === it.id ? colors.activeText : colors.text },
                ]}>
                {it.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined,
  },
});

export default SimpleDropdown; 