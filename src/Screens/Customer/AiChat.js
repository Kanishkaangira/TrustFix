import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Keyboard,
  Dimensions,
  Easing,
} from 'react-native';
import ScreenWrapper from '../../Components/ScreenWrapper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { getThemeColors } from '../../theme';

const { width: W } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const getChatColors = (isDark) => {
  const theme = getThemeColors(isDark);

  return {
    bgBase: isDark ? theme.background : '#FAF9F6',
    bgElevated: isDark ? theme.surface : '#FFFFFF',
    bgCard: isDark ? theme.surfaceMuted : '#FFFFFF',
    bgCard2: isDark ? '#202734' : '#F5F3EF',
    bgFloat: isDark ? '#1A222D' : '#F0EDE8',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    textPrimary: isDark ? theme.ink : '#141218',
    textSecondary: isDark ? '#B7C2D1' : '#5A5470',
    textTertiary: isDark ? theme.inkMuted : '#9990A8',
    coral: isDark ? '#FF7A45' : '#F55D1E',
    coralTint: isDark ? 'rgba(255,122,69,0.14)' : 'rgba(245,93,30,0.06)',
    coralBorder: isDark ? 'rgba(255,122,69,0.28)' : 'rgba(245,93,30,0.15)',
    violet: isDark ? '#A78BFA' : '#7C3AED',
    violetSoft: isDark ? 'rgba(167,139,250,0.16)' : 'rgba(124,58,237,0.08)',
    violetMid: isDark ? 'rgba(167,139,250,0.24)' : 'rgba(124,58,237,0.15)',
    violetBorder: isDark ? 'rgba(167,139,250,0.32)' : 'rgba(124,58,237,0.22)',
    violetDash: isDark ? 'rgba(167,139,250,0.40)' : 'rgba(124,58,237,0.35)',
    emerald: isDark ? theme.success : '#059669',
    emeraldGlow: isDark ? 'rgba(57,195,122,0.24)' : 'rgba(5,150,105,0.25)',
    amber: isDark ? theme.warning : '#D97706',
    amberSoft: isDark ? 'rgba(244,163,64,0.28)' : 'rgba(217,119,6,0.25)',
    danger: isDark ? '#FF7A7A' : '#E11D48',
    dangerTint: isDark ? 'rgba(255,122,122,0.15)' : 'rgba(225,29,72,0.08)',
    dangerBorder: isDark ? 'rgba(255,122,122,0.24)' : 'rgba(225,29,72,0.22)',
    cameraBody: isDark ? '#7E8898' : '#B2AEC0',
    cameraLens: isDark ? '#556173' : '#7E7A8E',
    cameraLensBorder: isDark ? '#7F8CA2' : '#9490A4',
    cameraLensInner: isDark ? '#2E3540' : '#59566A',
    cameraFlash: isDark ? '#9AA5B8' : '#9490A4',
    shadow: '#000000',
    isDark,
  };
};

const CHIPS = [
  { id: 1, label: 'AC not cooling', icon: '❄️' },
  { id: 2, label: 'Leaking pipe', icon: '💧' },
  { id: 3, label: 'No power', icon: '⚡' },
  { id: 4, label: 'Strange noise', icon: '🔊' },
];

const MEDIA = [
  { id: 'photo', label: 'Photo', icon: '🖼️' },
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'audio', label: 'Audio', icon: '🔉' },
];

// ── Typing Dots ──────────────────────────────────────────────
const TypingDots = ({ styles }) => {
  const dots = useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    [],
  );

  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, {
            toValue: -6,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0,
            duration: 260,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ])
      ).start();
    });
  }, [dots]);

  return (
    <View style={styles.typingRow}>
      <View style={styles.aiBadge}><Text style={styles.aiBadgeTxt}>AI</Text></View>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
};

// ── Diagnosis Result Card ────────────────────────────────────
const DiagCard = ({ colors, styles }) => (
  <View style={styles.diagCard}>
    <View style={styles.confRow}>
      <View>
        <Text style={styles.confNum}>87%</Text>
        <Text style={styles.confLabel}>CONFIDENCE SCORE</Text>
      </View>
      <View style={styles.confMeta}>
        <Text style={styles.confTime}>2.1s</Text>
        <Text style={styles.confLabel}>ANALYSIS TIME</Text>
      </View>
    </View>
    <View style={styles.issueBox}>
      <Text style={styles.issueLabel}>DETECTED ISSUE</Text>
      <Text style={styles.issueVal}>AC Compressor — Low Refrigerant Gas (R-32)</Text>
    </View>
    <Text style={styles.sevLabel}>SEVERITY LEVEL</Text>
    <View style={styles.sevBar}>
      {[colors.emerald, colors.amber, colors.amberSoft, colors.bgFloat, colors.bgFloat].map((c, i) => (
        <View key={i} style={[styles.sevSeg, { backgroundColor: c }]} />
      ))}
    </View>
    <View style={styles.sevFooter}>
      <Text style={styles.sevMin}>Minor</Text>
      <Text style={styles.sevMid}>● Moderate</Text>
      <Text style={styles.sevCrit}>Critical</Text>
    </View>
    <View style={styles.divider} />
    <Text style={styles.costLabel}>ESTIMATED REPAIR COST</Text>
    <Text style={styles.costValue}>₹1,200 – ₹1,800</Text>
    <Text style={styles.costSub}>Gas refill + labour + visit charge</Text>
    <TouchableOpacity style={styles.bookBtn}>
      <Text style={styles.bookBtnTxt}>Book with This Diagnosis →</Text>
    </TouchableOpacity>
    <View style={styles.diagBtnRow}>
      <TouchableOpacity style={[styles.ghostBtn, styles.diagBtn]}>
        <Text style={styles.ghostBtnTxt}>Video Call ₹49</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.surfBtn, styles.diagBtn]}>
        <Text style={styles.surfBtnTxt}>Re-scan</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Chat Bubble ──────────────────────────────────────────────
const Bubble = ({ msg, colors, styles }) => {
  const isAI = msg.role === 'ai';
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isAI ? styles.bubbleLeft : styles.bubbleRight,
        { opacity: fade, transform: [{ translateY: slide }] },
      ]}
    >
      {isAI && <View style={styles.aiBadge}><Text style={styles.aiBadgeTxt}>AI</Text></View>}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.bubbleTxt, isAI ? styles.bubbleTxtAI : styles.bubbleTxtUser]}>
          {msg.text}
        </Text>
        {msg.showDiag ? <DiagCard colors={colors} styles={styles} /> : null}
        <Text style={[styles.bubbleTime, !isAI && styles.bubbleTimeUser]}>
          {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Pulse Dot ────────────────────────────────────────────────
const PulseDot = ({ colors }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <View style={stylesLocal.pulseWrap}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.emeraldGlow,
          transform: [{ scale }],
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald }} />
    </View>
  );
};

// ══ MAIN SCREEN ══════════════════════════════════════════════
const AiChat = ({ navigation }) => {
  const { isDark } = useAppTheme();
  const colors = useMemo(() => getChatColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [activeChip, setActiveChip] = useState(null);
  const [activeMedia, setActiveMedia] = useState(null);
  const [chatMode, setChatMode] = useState(false);
  const scrollRef = useRef(null);

  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const onShow = (e) => setKbHeight(e.endCoordinates.height);
    const onHide = () => setKbHeight(0);
    const s1 = Keyboard.addListener('keyboardWillShow', onShow);
    const s2 = Keyboard.addListener('keyboardWillHide', onHide);

    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setTyping(false);
    setActiveChip(null);
    setActiveMedia(null);
    setChatMode(false);
  };

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

  const send = (overrideText) => {
    const txt = (overrideText ?? input).trim();
    if (!txt) return;

    if (!chatMode) setChatMode(true);

    const userMsg = { id: `u${Date.now()}`, role: 'user', ts: new Date(), text: txt };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setActiveChip(null);
    scrollBottom();
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const low = txt.toLowerCase();
      let ai = { id: `a${Date.now()}`, role: 'ai', ts: new Date(), text: '', showDiag: false };

      if (low.includes('ac') || low.includes('cool') || low.includes('refriger')) {
        ai.text = 'Diagnosis complete — here\'s what I found:';
        ai.showDiag = true;
      } else if (low.includes('leak') || low.includes('pipe') || low.includes('water')) {
        ai.text = '🔍 Detected: Loose pipe joint at elbow connector\n📍 Severity: Moderate\n💰 Estimated cost: ₹400 – ₹900\n\nRecommend booking a plumber within 48 hours.';
      } else if (low.includes('noise') || low.includes('sound')) {
        ai.text = '🔊 Noise analysis:\n\n• Loose motor bearing (78% probability)\n• Foreign debris in fan (15%)\n\n💰 Estimated: ₹600 – ₹1,200';
      } else if (low.includes('power') || low.includes('electric') || low.includes('trip')) {
        ai.text = '⚡ Power issue detected:\n\n• Tripped MCB / circuit breaker (high confidence)\n• Check your distribution board first\n\n💰 If wiring fault: ₹300 – ₹800';
      } else {
        ai.text = 'To give a precise diagnosis, please share:\n\n• Which appliance is affected?\n• How long has this been happening?\n• Any unusual smells or error codes?';
      }

      setMessages((p) => [...p, ai]);
      scrollBottom();
    }, 2000);
  };

  const onChipPress = (chip) => {
    setActiveChip(chip.id);
    setInput(chip.label);
    setTimeout(() => send(chip.label), 50);
  };

  return (
    <ScreenWrapper
      topColor={colors.bgElevated}
      bottomColor={colors.bgBase}
      statusBarStyle={statusBarStyle}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View>
            <Text style={styles.headerTitle}>AI Diagnosis</Text>
            <View style={styles.headerStatusRow}>
              <PulseDot colors={colors} />
              <Text style={styles.headerStatusTxt}>Online · Powered by TrustFix AI</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.clearBadge, !chatMode && styles.clearBadgeDisabled]}
          onPress={chatMode ? clearChat : undefined}
          activeOpacity={chatMode ? 0.75 : 1}
        >
          <Text style={styles.clearIcon}>🗑️</Text>
          <Text style={[styles.clearTxt, !chatMode && styles.clearTxtDisabled]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.body, { paddingBottom: kbHeight }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!chatMode ? (
            <>
              <View style={styles.uploadCard}>
                <View style={styles.cameraWrap}>
                  <View style={styles.cameraBody}>
                    <View style={styles.cameraTopBump} />
                    <View style={styles.cameraLens}>
                      <View style={styles.cameraLensInner} />
                    </View>
                    <View style={styles.cameraFlash} />
                  </View>
                </View>
                <Text style={styles.uploadTitle}>Show Us the Problem</Text>
                <Text style={styles.uploadSub}>Photo, video or audio — AI will diagnose it</Text>
                <View style={styles.mediaPills}>
                  {MEDIA.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.mediaPill, activeMedia === m.id && styles.mediaPillActive]}
                      onPress={() => setActiveMedia(m.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.mediaPillIcon}>{m.icon}</Text>
                      <Text style={[styles.mediaPillTxt, activeMedia === m.id && styles.mediaPillTxtActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.chipsWrap}>
                {CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, activeChip === chip.id && styles.chipActive]}
                    onPress={() => onChipPress(chip)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipIcon}>{chip.icon}</Text>
                    <Text style={[styles.chipTxt, activeChip === chip.id && styles.chipTxtActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.orLabel}>Or describe it below ↓</Text>
            </>
          ) : (
            <View style={styles.chatArea}>
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} colors={colors} styles={styles} />
              ))}
              {typing ? <TypingDots styles={styles} /> : null}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setActiveMedia('photo')}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="Type what's happening..."
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={300}
              returnKeyType="send"
            />
            {input.trim().length > 0 ? (
              <TouchableOpacity style={styles.sendBtn} onPress={() => send()}>
                <Text style={styles.sendBtnTxt}>↑</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn}>
                <Text style={styles.micIcon}>🎙️</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => send()} activeOpacity={0.88}>
            <Text style={styles.ctaIcon}>🤖</Text>
            <Text style={styles.ctaTxt}>Diagnose Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AiChat;

// ══════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════
const createStyles = (C) => StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: C.bgBase,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: C.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: C.isDark ? 0.18 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.bgFloat,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backArrow: {
    fontSize: 22,
    color: C.textPrimary,
    lineHeight: 26,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerStatusTxt: {
    fontSize: 10,
    color: C.textTertiary,
    fontWeight: '500',
  },
  clearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.dangerTint,
    borderWidth: 1.5,
    borderColor: C.dangerBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  clearBadgeDisabled: {
    backgroundColor: C.bgFloat,
    borderColor: C.border,
    opacity: 0.45,
  },
  clearIcon: {
    fontSize: 13,
  },
  clearTxt: {
    color: C.danger,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  clearTxtDisabled: {
    color: C.textTertiary,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },

  uploadCard: {
    borderWidth: 2,
    borderColor: C.violetDash,
    borderStyle: 'dashed',
    borderRadius: 22,
    backgroundColor: C.violetSoft,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraWrap: {
    width: 68,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cameraBody: {
    width: 58,
    height: 44,
    backgroundColor: C.cameraBody,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraTopBump: {
    position: 'absolute',
    top: -8,
    left: 9,
    width: 18,
    height: 10,
    backgroundColor: C.cameraBody,
    borderRadius: 5,
  },
  cameraLens: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.cameraLens,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.cameraLensBorder,
  },
  cameraLensInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.cameraLensInner,
  },
  cameraFlash: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.cameraFlash,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  uploadSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  mediaPills: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: C.isDark ? 0.12 : 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mediaPillActive: {
    backgroundColor: C.violetMid,
    borderColor: C.violet,
  },
  mediaPillIcon: {
    fontSize: 14,
  },
  mediaPillTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSecondary,
  },
  mediaPillTxtActive: {
    color: C.violet,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: C.violetSoft,
    borderWidth: 1.5,
    borderColor: C.violetBorder,
    minWidth: (W - 32 - 9) / 2 - 0.5,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: C.violetMid,
    borderColor: C.violet,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.violet,
  },
  chipTxtActive: {
    color: C.violet,
    fontWeight: '700',
  },
  orLabel: {
    fontSize: 13,
    color: C.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  chatArea: {
    paddingTop: 4,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.violetSoft,
    borderWidth: 1,
    borderColor: C.violetBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  aiBadgeTxt: {
    fontSize: 8,
    fontWeight: '900',
    color: C.violet,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    padding: 13,
  },
  bubbleAI: {
    backgroundColor: C.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: C.isDark ? 0.18 : 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: C.violet,
    borderBottomRightRadius: 4,
  },
  bubbleTxt: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTxtAI: {
    color: C.textPrimary,
  },
  bubbleTxtUser: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 5,
    color: C.textTertiary,
    textAlign: 'right',
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.55)',
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.violet,
  },

  diagCard: {
    marginTop: 12,
    backgroundColor: C.bgFloat,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  confMeta: {
    alignItems: 'flex-end',
  },
  confNum: {
    fontSize: 36,
    fontWeight: '800',
    color: C.violet,
    letterSpacing: -1,
  },
  confTime: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'right',
  },
  confLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textTertiary,
    marginTop: 2,
  },
  issueBox: {
    backgroundColor: C.bgCard2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  issueLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textTertiary,
    marginBottom: 4,
  },
  issueVal: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 19,
  },
  sevLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textTertiary,
    marginBottom: 6,
  },
  sevBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  sevSeg: {
    flex: 1,
    height: 7,
    borderRadius: 4,
  },
  sevFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sevMin: {
    fontSize: 9,
    color: C.textTertiary,
  },
  sevMid: {
    fontSize: 9,
    color: C.amber,
    fontWeight: '800',
  },
  sevCrit: {
    fontSize: 9,
    color: C.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textTertiary,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 26,
    fontWeight: '800',
    color: C.coral,
    letterSpacing: -0.5,
  },
  costSub: {
    fontSize: 11,
    color: C.textTertiary,
    marginBottom: 14,
  },
  bookBtn: {
    backgroundColor: C.coral,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: C.isDark ? 0.22 : 0.30,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnTxt: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  diagBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diagBtn: {
    flex: 1,
  },
  ghostBtn: {
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: C.coralTint,
    borderWidth: 1,
    borderColor: C.coralBorder,
  },
  ghostBtnTxt: {
    color: C.coral,
    fontWeight: '600',
    fontSize: 12,
  },
  surfBtn: {
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: C.bgCard2,
    borderWidth: 1,
    borderColor: C.border,
  },
  surfBtnTxt: {
    color: C.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },

  bottomBar: {
    backgroundColor: C.bgElevated,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: C.isDark ? 0.20 : 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C.bgCard2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 18,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 36,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.violet,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: C.isDark ? 0.24 : 0.30,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnTxt: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: -1,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.bgFloat,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 17,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.coral,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: C.isDark ? 0.24 : 0.32,
    shadowRadius: 14,
    elevation: 7,
  },
  ctaIcon: {
    fontSize: 20,
  },
  ctaTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

const stylesLocal = StyleSheet.create({
  pulseWrap: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
