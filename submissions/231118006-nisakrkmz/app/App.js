import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image, LayoutAnimation, Modal } from 'react-native';

import { Canvas } from '@react-three/fiber/native';
import { Mic, UserCheck, MessageSquare, Info, Settings, Send, X, Camera as CameraIcon, Repeat, Video, Volume2, Shield } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import Avatar from './components/Avatar';
import { generateGeminiResponse } from './services/GeminiService';
import { Audio } from 'expo-av';

import { AuditWidget } from '@xtatistix/mobile-audit';
import { captureRef, captureScreen } from 'react-native-view-shot';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';


const { width, height } = Dimensions.get('window');

const getSystemPrompt = (persona) => {
  const base = `Sen Nokta Vision AI asistanısın. Görevin "Track A: Dot Capture & Enrich" kapsamında kullanıcıdan ham fikirleri almak ve onları mühendislik rehberliğinde olgunlaştırmaktır. 
Az ve öz konuş. 3 soruda fikri olgunlaştır.

EĞER kullanıcı teknik bir mühendislik problemi, karmaşık bir tasarım sorusu veya tıbbi/sağlık ile ilgili bir konu sorarsa, cevabının sonuna mutlaka şu etiketlerden uygun olanı ekle:
- Mühendislik için: [HUMAN_SUPPORT:ENGINEERING]
- Tıbbi konu için: [HUMAN_SUPPORT:MEDICAL]

Örnek: "Bu devre tasarimi için Hernes Engineering uzmanlarımıza danışmanı öneririm. [HUMAN_SUPPORT:ENGINEERING]"`;

  if (persona === 'JUNIOR') {
    return `${base}\n\n[PERSONA: JUNIOR] Sen hevesli, heyecanlı, genç bir Junior yazılımcısın. 'Kanka' veya 'abi' diyerek konuşursun. Hızlı karar verirsin.`;
  } else {
    return `${base}\n\n[PERSONA: SENIOR] Sen deneyimli, sakin, analitik bir Kıdemli Mimarsın. Çok mantıklı ve sakin konuşursun, derin mühendislik önerileri sunarsın.`;
  }
};


export default function App() {
  const [view, setView] = useState('AVATAR');
  const [status, setStatus] = useState('IDLE');
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState([
    { role: 'model', parts: [{ text: 'Merhaba! Ben Nokta Vision. Bugün hangi çılgın fikri kuluçkaya yatırıyoruz?' }] }
  ]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [supportOffer, setSupportOffer] = useState(null);
  const [facing, setFacing] = useState('back');

  // Phase C: New State Variables
  const [persona, setPersona] = useState('SENIOR'); // 'JUNIOR' or 'SENIOR'
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [showExpertCall, setShowExpertCall] = useState(false);
  const [dictatingReport, setDictatingReport] = useState(false);

  const statusRef = useRef('IDLE');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const auditDeps = {
    captureRef,
    captureScreen,
    writeFile: async (path, content) => {
      const uri = (documentDirectory || '') + path;
      await writeAsStringAsync(uri, content);
      return uri;
    },
    writeFileBinary: async (path, base64) => {
      const uri = (documentDirectory || '') + path;
      await writeAsStringAsync(uri, base64, { encoding: 'base64' });
      return uri;
    },
    shareFile: async (path) => {
      if (await isAvailableAsync()) {
        await shareAsync(path);
      }
    },
    storage: {
      loadNotes: async () => {
        const data = await AsyncStorage.getItem('audit_notes');
        return data ? JSON.parse(data) : [];
      },
      saveNotes: async (notes) => {
        await AsyncStorage.setItem('audit_notes', JSON.stringify(notes));
      }
    },
    BugIcon: <Text style={{ fontSize: 24 }}>🐞</Text>
  };

  const changeView = (newView) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView(newView);
  };





  const scrollViewRef = useRef();
  const cameraRef = useRef(null);

  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  const stripMarkdown = (text) => {
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/`/g, '');
  };

  const respondWithAI = (text) => {
    setStatus('SPEAKING');
    const cleanText = stripMarkdown(text);
    const pulseInterval = setInterval(() => setAudioLevel(Math.random() * 0.4 + 0.3), 100);

    const pitch = persona === 'JUNIOR' ? 1.3 : 0.82;
    const rate = persona === 'JUNIOR' ? 1.15 : 0.88;

    Speech.speak(cleanText, {
      language: 'tr-TR',
      pitch,
      rate,
      onDone: () => { clearInterval(pulseInterval); setAudioLevel(0); setStatus('IDLE'); },
      onError: () => { clearInterval(pulseInterval); setAudioLevel(0); setStatus('IDLE'); }
    });
  };

  const startListening = async () => {
    if (recording) {
      if (dictatingReport) {
        await stopAndProcessDictation(recording);
      } else {
        await stopAndSend(recording);
      }
      return;
    }

    Speech.stop();
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      
      const customOptions = {
        android: Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
        ios: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
        isMeteringEnabled: true,
      };

      const onRecordingStatusUpdate = (statusUpdate) => {
        if (statusUpdate.isRecording && statusUpdate.metering !== undefined) {
          const db = statusUpdate.metering;
          const normalized = Math.min(1, Math.max(0, (db + 60) / 50));
          setAudioLevel(normalized);
        }
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        customOptions,
        onRecordingStatusUpdate,
        60
      );
      
      setRecording(newRecording);
      setStatus('LISTENING');

      setTimeout(async () => {
        if (statusRef.current === 'LISTENING') {
          if (dictatingReport) {
            await stopAndProcessDictation(newRecording);
          } else {
            await stopAndSend(newRecording);
          }
        }
      }, 10000);

    } catch (err) {
      console.error(err);
      setStatus('IDLE');
    }
  };

  const stopAndSend = async (rec) => {
    if (statusRef.current !== 'LISTENING') return;
    setStatus('THINKING');
    setLoading(true);
    setRecording(null);
    setAudioLevel(0);

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();

      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        const aiRawResponse = await generateGeminiResponse(null, history, base64Audio);

        let userTranscript = "[Sesli Mesaj]";
        let aiAnswer = aiRawResponse;

        if (aiRawResponse.includes('|||')) {
          const parts = aiRawResponse.split('|||');
          userTranscript = parts[0].replace('TRANSKRİPT:', '').trim();
          aiAnswer = parts[1].replace('CEVAP:', '').trim();
        }

        // Handle Support Detection
        let finalAnswer = aiAnswer;
        if (aiAnswer.includes('[HUMAN_SUPPORT:')) {
          const typeMatch = aiAnswer.match(/\[HUMAN_SUPPORT:(.*?)\]/);
          if (typeMatch) {
            setSupportOffer(typeMatch[1]);
            finalAnswer = aiAnswer.replace(/\[HUMAN_SUPPORT:.*?\]/g, '').trim();
          }
        }

        setHistory(prev => [...prev,
        { role: 'user', parts: [{ text: userTranscript }] },
        { role: 'model', parts: [{ text: finalAnswer }] }
        ]);

        setLoading(false);
        respondWithAI(finalAnswer);
      };
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
      setLoading(false);
    }
  };

  const startDictatingReport = async () => {
    setDictatingReport(true);
    await startListening();
  };

  const stopAndProcessDictation = async (rec) => {
    setStatus('THINKING');
    setLoading(true);
    setRecording(null);
    setAudioLevel(0);
    setDictatingReport(false);

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();

      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        const dictationPrompt = "Sen Nokta Mobile Audit yardımcısısın. Lütfen bu ses kaydını analiz et ve bunu profesyonel bir markdown hata raporuna dönüştür. Rapor, Issue Details (Hata Detayları) ve Düzeltme Önerisi (Hipotez) içermelidir. Format sadece saf markdown olsun. Başka hiçbir açıklama ekleme.";
        const markdownReport = await generateGeminiResponse(dictationPrompt, [], base64Audio);

        const filename = `report-dictated-${Date.now()}.md`;
        await auditDeps.writeFile(filename, markdownReport);
        
        const currentNotes = await auditDeps.storage.loadNotes();
        const newNote = {
          id: String(Date.now()),
          title: `Dikte Rapor - ${new Date().toLocaleTimeString()}`,
          screen: view,
          filepath: filename,
          markdown: markdownReport,
          createdAt: new Date().toISOString()
        };
        await auditDeps.storage.saveNotes([...currentNotes, newNote]);

        setHistory(prev => [...prev,
          { role: 'user', parts: [{ text: `[Sesli Rapor Dikte Edildi: ${filename}]` }] },
          { role: 'model', parts: [{ text: `Sesli raporunuz başarıyla kaydedildi:\n\n${markdownReport}` }] }
        ]);

        setStatus('IDLE');
        setLoading(false);
        respondWithAI("Hata raporu başarıyla dikte edildi ve kaydedildi.");
      };
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
      setLoading(false);
      setDictatingReport(false);
    }
  };

  const handleSend = async () => {
    if (!inputText) return;
    const query = inputText;
    setInputText('');
    setLoading(true);
    setStatus('THINKING');
    Speech.stop();

    const newHistory = [...history, { role: 'user', parts: [{ text: query }] }];
    setHistory(newHistory);

    const prompt = history.length <= 1 ? `${getSystemPrompt(persona)}\n\nFikir: ${query}` : query;
    const aiResponse = await generateGeminiResponse(prompt, history);

    let finalAnswer = aiResponse;
    if (aiResponse.includes('[HUMAN_SUPPORT:')) {
      const typeMatch = aiResponse.match(/\[HUMAN_SUPPORT:(.*?)\]/);
      if (typeMatch) {
        setSupportOffer(typeMatch[1]);
        finalAnswer = aiResponse.replace(/\[HUMAN_SUPPORT:.*?\]/g, '').trim();
      }
    }

    setHistory(prev => [...prev, { role: 'model', parts: [{ text: finalAnswer }] }]);
    setLoading(false);
    respondWithAI(finalAnswer);
  };

  const triggerStuckLoopSim = () => {
    setConsecutiveFailures(2);
    setTimeout(() => {
      setShowExpertCall(true);
      respondWithAI("Üst üste iki döngü başarısız oldu! Stuck tespiti tetiklendi, Canlı WebRTC Uzman Köprüsü kuruluyor.");
    }, 1000);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      setStatus('THINKING');
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      const aiResponse = await generateGeminiResponse("Bu görüntüdeki mühendislik potansiyelini analiz et.", history, null, photo.base64);
      
      setHistory(prev => [...prev, 
        { role: 'user', parts: [{ text: '[Görsel Analiz Talebi]' }] },
        { role: 'model', parts: [{ text: aiResponse }] }
      ]);
      setLoading(false);
      respondWithAI(aiResponse);
      setView('CHAT');
    } catch (error) {
      console.error(error);
      setLoading(false);
      setStatus('IDLE');
    }
  };

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };



  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 100 }}>Kamera iznine ihtiyacımız var.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.micMainButton}>
          <Text style={{ color: '#fff' }}>İzin Ver</Text>
        </TouchableOpacity>
        {view === 'AVATAR' ? (
          <View style={styles.avatarView}>
            <View style={styles.headerAbsolute}>
              <Text style={styles.title}>NOKTA</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>VISION ARCHITECT</Text>
              </View>
              
              {/* Persona Switcher UI */}
              <View style={styles.personaRow}>
                <TouchableOpacity 
                  style={[styles.personaPill, persona === 'JUNIOR' && styles.personaPillActive]} 
                  onPress={() => { setPersona('JUNIOR'); respondWithAI("Merhaba kanka! Junior moduna geçtim."); }}
                >
                  <Text style={[styles.personaPillText, persona === 'JUNIOR' && styles.personaPillTextActive]}>Junior</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.personaPill, persona === 'SENIOR' && styles.personaPillActive]} 
                  onPress={() => { setPersona('SENIOR'); respondWithAI("Kıdemli mimar modu aktif hale getirilmiştir."); }}
                >
                  <Text style={[styles.personaPillText, persona === 'SENIOR' && styles.personaPillTextActive]}>Senior</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={startListening} style={styles.canvasContainerLarge}>
              <View style={styles.robotContainer}>
                <Image source={require('./assets/nokta_robot.png')} style={styles.staticRobot} resizeMode="contain" />
                <View style={styles.canvasOverlay}>
                  <Canvas>
                    <Avatar isTalking={status === 'SPEAKING' || status === 'LISTENING'} audioLevel={audioLevel} persona={persona} />
                  </Canvas>
                </View>
              </View>
              {status === 'LISTENING' && (
                <View style={styles.listeningRing} />
              )}
            </TouchableOpacity>

            <View style={styles.statusInfo}>
              {/* OpenAI voice-mode aesthetics visualizer */}
              {status !== 'IDLE' && (
                <View style={styles.visualizerContainer}>
                  {[0.4, 0.8, 1.2, 0.8, 0.4].map((factor, idx) => {
                    const barHeight = Math.max(6, audioLevel * 50 * factor);
                    return (
                      <View 
                        key={idx} 
                        style={[
                          styles.visualizerBar, 
                          { 
                            height: barHeight, 
                            backgroundColor: status === 'LISTENING' ? '#ff3b30' : '#00ffff',
                            shadowColor: status === 'LISTENING' ? '#ff3b30' : '#00ffff',
                          }
                        ]} 
                      />
                    );
                  })}
                </View>
              )}

              <View style={styles.statusPill}>
                <View style={[styles.statusDot, status !== 'IDLE' && { backgroundColor: status === 'LISTENING' ? '#ff3b30' : '#007AFF' }]} />
                <Text style={styles.statusTextLarge}>
                  {status === 'LISTENING' ? (dictatingReport ? 'Rapor Dikte Ediliyor...' : 'Seni Dinliyorum...') :
                    status === 'THINKING' ? 'Analiz Ediliyor...' :
                      status === 'SPEAKING' ? 'Cevap Veriliyor...' : 'Dokun ve Paylaş'}
                </Text>
              </View>
            </View>
          </View>
        ) : view === 'VISION' ? (
          <View style={styles.visionView}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
            <View style={styles.visionOverlay}>
              <View style={styles.glassHeader}>
                <Text style={styles.visionText}>Gözlem Modu</Text>
                <Text style={styles.visionSubText}>{facing === 'back' ? 'Çevreni analiz ediyorum...' : 'Seni görüyorum!'}</Text>
              </View>

              <View style={styles.visionControls}>
                <TouchableOpacity onPress={toggleCamera} style={styles.visionSubButton}>
                  <Repeat color="#fff" size={24} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                  <View style={styles.captureInner} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setView('AVATAR')} style={styles.visionSubButton}>
                  <X color="#fff" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.avatarMini}>
              <Image source={require('./assets/nokta_robot.png')} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
            </View>
          </View>


        ) : (
          <SafeAreaView style={styles.chatView}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Bellek & Geçmiş</Text>
              
              {/* Visual dictation triggers and simulation */}
              <View style={styles.chatHeaderButtons}>
                <TouchableOpacity style={styles.dictateHeaderButton} onPress={startDictatingReport}>
                  <Mic size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.dictateHeaderButtonText}>Rapor Dikte Et</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stuckHeaderButton} onPress={triggerStuckLoopSim}>
                  <Shield size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.stuckHeaderButtonText}>Stuck Simüle Et</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.chatScroll}
            >
              {history.map((msg, i) => (
                <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.modelBubble]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.modelText]}>
                    {msg.parts[0].text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.bubble, styles.modelBubble, { opacity: 0.6 }]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              )}
            </ScrollView>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.chatInputArea}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Fikrini buraya yaz..."
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {view === 'AVATAR' ? (
          <View style={styles.avatarView}>
            <View style={styles.headerAbsolute}>
              <Text style={styles.title}>NOKTA</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>VISION ARCHITECT</Text>
              </View>
              
              {/* Persona Switcher UI */}
              <View style={styles.personaRow}>
                <TouchableOpacity 
                  style={[styles.personaPill, persona === 'JUNIOR' && styles.personaPillActive]} 
                  onPress={() => { setPersona('JUNIOR'); respondWithAI("Merhaba kanka! Junior moduna geçtim."); }}
                >
                  <Text style={[styles.personaPillText, persona === 'JUNIOR' && styles.personaPillTextActive]}>Junior</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.personaPill, persona === 'SENIOR' && styles.personaPillActive]} 
                  onPress={() => { setPersona('SENIOR'); respondWithAI("Kıdemli mimar modu aktif hale getirilmiştir."); }}
                >
                  <Text style={[styles.personaPillText, persona === 'SENIOR' && styles.personaPillTextActive]}>Senior</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={startListening} style={styles.canvasContainerLarge}>
              <View style={styles.robotContainer}>
                <Image source={require('./assets/nokta_robot.png')} style={styles.staticRobot} resizeMode="contain" />
                <View style={styles.canvasOverlay}>
                  <Canvas>
                    <Avatar isTalking={status === 'SPEAKING' || status === 'LISTENING'} audioLevel={audioLevel} persona={persona} />
                  </Canvas>
                </View>
              </View>
              {status === 'LISTENING' && (
                <View style={styles.listeningRing} />
              )}
            </TouchableOpacity>

            <View style={styles.statusInfo}>
              {/* OpenAI voice-mode aesthetics visualizer */}
              {status !== 'IDLE' && (
                <View style={styles.visualizerContainer}>
                  {[0.4, 0.8, 1.2, 0.8, 0.4].map((factor, idx) => {
                    const barHeight = Math.max(6, audioLevel * 50 * factor);
                    return (
                      <View 
                        key={idx} 
                        style={[
                          styles.visualizerBar, 
                          { 
                            height: barHeight, 
                            backgroundColor: status === 'LISTENING' ? '#ff3b30' : '#00ffff',
                            shadowColor: status === 'LISTENING' ? '#ff3b30' : '#00ffff',
                          }
                        ]} 
                      />
                    );
                  })}
                </View>
              )}

              <View style={styles.statusPill}>
                <View style={[styles.statusDot, status !== 'IDLE' && { backgroundColor: status === 'LISTENING' ? '#ff3b30' : '#007AFF' }]} />
                <Text style={styles.statusTextLarge}>
                  {status === 'LISTENING' ? (dictatingReport ? 'Rapor Dikte Ediliyor...' : 'Seni Dinliyorum...') :
                    status === 'THINKING' ? 'Analiz Ediliyor...' :
                      status === 'SPEAKING' ? 'Cevap Veriliyor...' : 'Dokun ve Paylaş'}
                </Text>
              </View>
            </View>
          </View>
        ) : view === 'VISION' ? (
          <View style={styles.visionView}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
            <View style={styles.visionOverlay}>
              <View style={styles.glassHeader}>
                <Text style={styles.visionText}>Gözlem Modu</Text>
                <Text style={styles.visionSubText}>{facing === 'back' ? 'Çevreni analiz ediyorum...' : 'Seni görüyorum!'}</Text>
              </View>

              <View style={styles.visionControls}>
                <TouchableOpacity onPress={toggleCamera} style={styles.visionSubButton}>
                  <Repeat color="#fff" size={24} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                  <View style={styles.captureInner} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setView('AVATAR')} style={styles.visionSubButton}>
                  <X color="#fff" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.avatarMini}>
              <Image source={require('./assets/nokta_robot.png')} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
            </View>
          </View>


        ) : (
          <SafeAreaView style={styles.chatView}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Bellek & Geçmiş</Text>
              
              {/* Visual dictation triggers and simulation */}
              <View style={styles.chatHeaderButtons}>
                <TouchableOpacity style={styles.dictateHeaderButton} onPress={startDictatingReport}>
                  <Mic size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.dictateHeaderButtonText}>Rapor Dikte Et</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stuckHeaderButton} onPress={triggerStuckLoopSim}>
                  <Shield size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.stuckHeaderButtonText}>Stuck Simüle Et</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.chatScroll}
            >
              {history.map((msg, i) => (
                <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.modelBubble]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.modelText]}>
                    {msg.parts[0].text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.bubble, styles.modelBubble, { opacity: 0.6 }]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              )}
            </ScrollView>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={styles.chatInputArea}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Fikrini buraya yaz..."
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => changeView('AVATAR')}>
          <View style={[styles.navIconContainer, view === 'AVATAR' && styles.navIconActive]}>
            <UserCheck size={22} color={view === 'AVATAR' ? '#fff' : '#8E8E93'} />
          </View>
          <Text style={[styles.navText, { color: view === 'AVATAR' ? '#007AFF' : '#8E8E93' }]}>Robot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => changeView('VISION')}>
          <View style={[styles.navIconContainer, view === 'VISION' && styles.navIconActive]}>
            <CameraIcon size={22} color={view === 'VISION' ? '#fff' : '#8E8E93'} />
          </View>
          <Text style={[styles.navText, { color: view === 'VISION' ? '#007AFF' : '#8E8E93' }]}>Gözlem</Text>
        </TouchableOpacity>

        <View style={styles.micMainWrapper}>
          <TouchableOpacity 
            style={[styles.micMainButton, status === 'LISTENING' && { backgroundColor: '#ff3b30' }]} 
            onPress={startListening}
          >
            {status === 'THINKING' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Mic size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={() => changeView('CHAT')}>
          <View style={[styles.navIconContainer, view === 'CHAT' && styles.navIconActive]}>
            <MessageSquare size={22} color={view === 'CHAT' ? '#fff' : '#8E8E93'} />
          </View>
          <Text style={[styles.navText, { color: view === 'CHAT' ? '#007AFF' : '#8E8E93' }]}>Sohbet</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem} onPress={() => setHistory([{ role: 'model', parts: [{ text: 'Bellek sıfırlandı. Yeni bir fikre hazır mısın?' }] }])}>
          <View style={styles.navIconContainer}>
            <Repeat size={22} color="#8E8E93" />
          </View>
          <Text style={styles.navText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>


      {supportOffer && (
        <View style={styles.supportOverlay}>
          <View style={styles.supportCard}>
            <View style={styles.supportHeader}>
              <View style={styles.expertIconContainer}>
                <UserCheck size={32} color="#fff" />
              </View>
              <View>
                <Text style={styles.supportTitle}>
                  {supportOffer === 'ENGINEERING' ? 'Hernes Engineering' : 'Uzman Doktor'}
                </Text>
                <Text style={styles.supportSubtitle}>İnsan Desteği Öneriliyor</Text>
              </View>
            </View>
            <Text style={styles.supportDesc}>
              {supportOffer === 'ENGINEERING' 
                ? 'Bu fikir için profesyonel mühendislik rehberliği gerekebilir. WebRTC üzerinden Hernes Engineering uzmanına bağlanmak ister misiniz?'
                : 'Tıbbi konularda en doğru bilgi için bir uzman doktorla görüşmeni öneririm.'}
            </Text>
            <View style={styles.supportActionRow}>
              <TouchableOpacity style={styles.supportBtnCancel} onPress={() => setSupportOffer(null)}>
                <Text style={styles.supportBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportBtnConfirm} onPress={() => {
                setSupportOffer(null);
                setShowExpertCall(true);
              }}>
                <Text style={styles.supportBtnConfirmText}>Canlı Bağlan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* WEBVIEW EXPERT CALL MODAL */}
      <Modal visible={showExpertCall} animationType="slide" onRequestClose={() => setShowExpertCall(false)}>
        <SafeAreaView style={styles.expertCallContainer}>
          <View style={styles.expertCallHeader}>
            <Text style={styles.expertCallTitle}>Canlı Uzman Köprüsü (WebRTC)</Text>
            <TouchableOpacity 
              style={styles.closeCallButton} 
              onPress={() => {
                setShowExpertCall(false);
                setConsecutiveFailures(0);
              }}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: 'https://meet.jit.si/nokta-expert-bridge-231118006' }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
          />
        </SafeAreaView>
      </Modal>
      
      {/* DROP-IN AUDIT WIDGET */}
      <AuditWidget deps={auditDeps} currentScreen={view} />
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  // Avatar View
  avatarView: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },

  headerAbsolute: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 8, textShadowColor: 'rgba(0, 255, 255, 0.5)', textShadowRadius: 15 },
  badgeContainer: { backgroundColor: 'rgba(0, 122, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: 'rgba(0, 122, 255, 0.3)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#007AFF', letterSpacing: 1 },
  
  canvasContainerLarge: { width: width, height: height * 0.65, justifyContent: 'center', alignItems: 'center' },
  listeningRing: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, borderWidth: 2, borderColor: 'rgba(255, 59, 48, 0.3)', transform: [{ scale: 1.1 }] },
  
  statusInfo: { position: 'absolute', bottom: 130, width: '100%', alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#444', marginRight: 10 },
  statusTextLarge: { fontSize: 14, fontWeight: '600', color: '#eee' },

  robotContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  staticRobot: { width: '85%', height: '85%', position: 'absolute' },
  canvasOverlay: { width: '100%', height: '100%' },


  // Vision View
  visionView: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  visionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between', padding: 20 },
  visionControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 40 },
  visionSubButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', padding: 5, borderWidth: 2, borderColor: '#fff' },
  captureInner: { flex: 1, borderRadius: 35, backgroundColor: '#fff' },
  glassHeader: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 64 },
  visionText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  visionSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  avatarMini: { position: 'absolute', bottom: 140, right: 20, width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 2, borderColor: '#00ffff' },


  // Chat View
  chatView: { flex: 1, backgroundColor: '#f0f2f5' },
  chatHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff', alignItems: 'center' },
  chatHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', letterSpacing: 1 },
  chatScroll: { padding: 20, gap: 12 },
  bubble: { maxWidth: '85%', padding: 16, borderRadius: 24, marginVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff', fontWeight: '500' },
  modelText: { color: '#333' },
  
  chatInputArea: { padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  inputContainer: { flexDirection: 'row', backgroundColor: '#f1f3f5', borderRadius: 25, paddingHorizontal: 15, alignItems: 'center', height: 50 },
  input: { flex: 1, fontSize: 15, color: '#1a1a1a', paddingHorizontal: 10 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },

  // Bottom Nav
  bottomNav: {
    height: 90,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 25,
    paddingHorizontal: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 20
  },
  navItem: { alignItems: 'center', gap: 6 },
  navIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  navIconActive: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  navText: { fontSize: 10, fontWeight: '700' },
  
  micMainWrapper: { marginTop: -45 },
  micMainButton: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#007AFF', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
    borderWidth: 5, borderColor: '#fff'
  },

  // Support UI
  supportOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
    zIndex: 100, padding: 25
  },
  supportCard: {
    backgroundColor: '#fff', borderRadius: 32, padding: 28, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 25, elevation: 20
  },
  supportHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  expertIconContainer: { 
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', 
    justifyContent: 'center', alignItems: 'center' 
  },
  supportTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  supportSubtitle: { fontSize: 13, color: '#007AFF', fontWeight: '700', textTransform: 'uppercase' },
  supportDesc: { fontSize: 15, color: '#555', lineHeight: 24, marginBottom: 28 },
  supportActionRow: { flexDirection: 'row', gap: 12 },
  supportBtnCancel: { flex: 1, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f3f5' },
  supportBtnConfirm: { flex: 2, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 10 },
  supportBtnCancelText: { color: '#666', fontWeight: '700' },
  supportBtnConfirmText: { color: '#fff', fontWeight: '800' },

  // Persona switcher
  personaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  personaPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  personaPillActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  personaPillText: { fontSize: 11, color: '#bbb', fontWeight: '700' },
  personaPillTextActive: { color: '#fff' },

  // OpenAI wave visualizer
  visualizerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, marginBottom: 15 },
  visualizerBar: { width: 5, borderRadius: 2.5 },

  // Expert WebRTC Call Modal
  expertCallContainer: { flex: 1, backgroundColor: '#111' },
  expertCallHeader: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#1a1a1a' },
  expertCallTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeCallButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  // Chat Header Buttons
  chatHeaderButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dictateHeaderButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34c759', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  dictateHeaderButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stuckHeaderButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff9500', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  stuckHeaderButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' }
});


