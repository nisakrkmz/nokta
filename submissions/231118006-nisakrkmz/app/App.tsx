import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { AuditWidget } from '@xtatistix/mobile-audit';
import { captureRef, captureScreen } from 'react-native-view-shot';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Screens with intentional bugs ---

const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Home Screen</Text>
    <View style={styles.buggyContainer}>
      <Text style={styles.overflowText}>
        BUG #1 (UI): This text is supposed to fit in the box but it overflows because the container has a fixed height and no wrapping logic. 
        It just keeps going and going and you can't read the end of it because of the 'overflow: hidden' style equivalent.
      </Text>
    </View>
  </View>
);

const ProfileScreen = () => {
  const [birthYear, setBirthYear] = useState('2000');
  // BUG #2 (Logic): Incorrect age calculation (using 2020 instead of 2026)
  const age = 2026 - parseInt(birthYear || '0');

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile Screen</Text>
      <Text>Enter Birth Year:</Text>
      <TextInput 
        style={styles.input} 
        value={birthYear} 
        onChangeText={setBirthYear} 
        keyboardType="numeric"
      />
      <View style={styles.resultBox}>
        <Text style={styles.resultText}>Your Age (Calculated): {age}</Text>
        <Text style={styles.hint}>Wait, something is wrong with the math here...</Text>
      </View>
    </View>
  );
};

const SettingsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Settings Screen</Text>
    <View style={styles.settingsItem}>
      <Text>Dark Mode</Text>
      {/* BUG #3 (UI): Invisible Button - button color matches background exactly */}
      <TouchableOpacity style={styles.invisibleButton}>
        <Text style={{ color: '#F5F5F5' }}>Reset All</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function App() {
  const [currentTab, setCurrentTab] = useState<'Home' | 'Profile' | 'Settings'>('Home');

  // Audit Widget Dependencies - Tüm gerekli alanlar eklendi
  const auditDeps = {
    captureRef,
    captureScreen,
    writeFile: async (path: string, content: string): Promise<string> => {
      const uri = (documentDirectory || '') + path;
      await writeAsStringAsync(uri, content);
      return uri;
    },
    writeFileBinary: async (path: string, base64: string): Promise<string> => {
      const uri = (documentDirectory || '') + path;
      await writeAsStringAsync(uri, base64, { encoding: 'base64' });
      return uri;
    },
    shareFile: async (path: string): Promise<void> => {
      if (await isAvailableAsync()) {
        await shareAsync(path);
      }
    },
    storage: {
      loadNotes: async (): Promise<any[]> => {
        const data = await AsyncStorage.getItem('audit_notes');
        return data ? JSON.parse(data) : [];
      },
      saveNotes: async (notes: any[]): Promise<void> => {
        await AsyncStorage.setItem('audit_notes', JSON.stringify(notes));
      }
    },
    BugIcon: <Text style={{ fontSize: 24 }}>🐞</Text>
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {currentTab === 'Home' && <HomeScreen />}
        {currentTab === 'Profile' && <ProfileScreen />}
        {currentTab === 'Settings' && <SettingsScreen />}
      </View>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setCurrentTab('Home')} style={styles.navItem}>
          <Text style={currentTab === 'Home' ? styles.navActive : styles.navInactive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTab('Profile')} style={styles.navItem}>
          <Text style={currentTab === 'Profile' ? styles.navActive : styles.navInactive}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTab('Settings')} style={styles.navItem}>
          <Text style={currentTab === 'Settings' ? styles.navActive : styles.navInactive}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* DROP-IN AUDIT WIDGET */}
      <AuditWidget 
        deps={auditDeps} 
        currentScreen={currentTab} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  // BUG #1 Styles
  buggyContainer: {
    width: '80%',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  overflowText: {
    fontSize: 16,
  },
  // BUG #2 Styles
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  resultText: {
    fontSize: 18,
    color: '#1976d2',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // BUG #3 Styles
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  invisibleButton: {
    backgroundColor: '#f5f5f5', // Identical to settingsItem background
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f5f5f5', // Also invisible
  },
  // Nav Styles
  navBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  navInactive: {
    color: '#8E8E93',
  },
});
