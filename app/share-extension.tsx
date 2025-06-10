import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRestaurants } from '../src/hooks/useRestaurants';

export default function ShareExtension() {
  const { text, url } = useLocalSearchParams<{ text: string; url: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { storePin } = useRestaurants();

  const handleSavePin = async () => {
    if (!text || !url) return;
    
    try {
      setIsLoading(true);
      await storePin({ text, url });
      router.back();
    } catch (error) {
      console.error('儲存 Pin 時發生錯誤:', error);
      // 這裡可以加入錯誤處理邏輯
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>新增 Pin</Text>
        
        <View style={styles.previewContainer}>
          {text && (
            <View style={styles.textContainer}>
              <Text style={styles.label}>預覽文字：</Text>
              <Text style={styles.previewText} numberOfLines={3}>
                {text}
              </Text>
            </View>
          )}
          
          {url && (
            <View style={styles.urlContainer}>
              <Text style={styles.label}>網址：</Text>
              <Text style={styles.urlText} numberOfLines={2}>
                {url}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled
          ]}
          onPress={handleSavePin}
          disabled={isLoading || !text || !url}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>存成 Pin</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    marginBottom: 16,
  },
  urlContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  urlText: {
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: '#0056B3',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 