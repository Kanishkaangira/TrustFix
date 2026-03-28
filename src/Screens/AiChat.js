import React, { useState, useRef, useEffect } from 'react';
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
import ScreenWrapper from '../Components/ScreenWrapper';

const { width: W } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const T = {
  bgBase:       '#FAF9F6',
  bgElevated:   '#FFFFFF',
  bgCard:       '#FFFFFF',
  bgCard2:      '#F5F3EF',
  bgFloat:      '#F0EDE8',
  border:       'rgba(0,0,0,0.07)',
  textPrimary:  '#141218',
  textSecondary:'#5A5470',
  textTertiary: '#9990A8',
  coral:        '#F55D1E',
  coralTint:    'rgba(245,93,30,0.06)',
  coralBorder:  'rgba(245,93,30,0.15)',
  violet:       '#7C3AED',
  violetSoft:   'rgba(124,58,237,0.08)',
  violetMid:    'rgba(124,58,237,0.15)',
  violetBorder: 'rgba(124,58,237,0.22)',
  violetDash:   'rgba(124,58,237,0.35)',
  emerald:      '#059669',
  amber:        '#D97706',
};

const CHIPS = [
  { id: 1, label: 'AC not cooling', icon: '❄️' },
  { id: 2, label: 'Leaking pipe',   icon: '💧' },
  { id: 3, label: 'No power',       icon: '⚡' },
  { id: 4, label: 'Strange noise',  icon: '🔊' },
];

const MEDIA = [
  { id: 'photo', label: 'Photo', icon: '🖼️' },
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'audio', label: 'Audio', icon: '🔉' },
];

// ── Typing Dots ──────────────────────────────────────────────
const TypingDots = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: -6, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(d, { toValue: 0,  duration: 260, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(500),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={s.typingRow}>
      <View style={s.aiBadge}><Text style={s.aiBadgeTxt}>AI</Text></View>
      <View style={s.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[s.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
};

// ── Diagnosis Result Card ────────────────────────────────────
const DiagCard = () => (
  <View style={s.diagCard}>
    <View style={s.confRow}>
      <View>
        <Text style={s.confNum}>87%</Text>
        <Text style={s.confLabel}>CONFIDENCE SCORE</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.confTime}>2.1s</Text>
        <Text style={s.confLabel}>ANALYSIS TIME</Text>
      </View>
    </View>
    <View style={s.issueBox}>
      <Text style={s.issueLabel}>DETECTED ISSUE</Text>
      <Text style={s.issueVal}>AC Compressor — Low Refrigerant Gas (R-32)</Text>
    </View>
    <Text style={s.sevLabel}>SEVERITY LEVEL</Text>
    <View style={s.sevBar}>
      {[T.emerald, T.amber, 'rgba(217,119,6,0.25)', T.bgFloat, T.bgFloat].map((c, i) => (
        <View key={i} style={[s.sevSeg, { backgroundColor: c }]} />
      ))}
    </View>
    <View style={s.sevFooter}>
      <Text style={s.sevMin}>Minor</Text>
      <Text style={s.sevMid}>● Moderate</Text>
      <Text style={s.sevCrit}>Critical</Text>
    </View>
    <View style={s.divider} />
    <Text style={s.costLabel}>ESTIMATED REPAIR COST</Text>
    <Text style={s.costValue}>₹1,200 – ₹1,800</Text>
    <Text style={s.costSub}>Gas refill + labour + visit charge</Text>
    <TouchableOpacity style={s.bookBtn}>
      <Text style={s.bookBtnTxt}>Book with This Diagnosis →</Text>
    </TouchableOpacity>
    <View style={s.diagBtnRow}>
      <TouchableOpacity style={[s.ghostBtn, { flex: 1 }]}>
        <Text style={s.ghostBtnTxt}>Video Call ₹49</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.surfBtn, { flex: 1 }]}>
        <Text style={s.surfBtnTxt}>Re-scan</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Chat Bubble ──────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isAI = msg.role === 'ai';
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[
      s.bubbleRow,
      isAI ? s.bubbleLeft : s.bubbleRight,
      { opacity: fade, transform: [{ translateY: slide }] },
    ]}>
      {isAI && <View style={s.aiBadge}><Text style={s.aiBadgeTxt}>AI</Text></View>}
      <View style={[s.bubble, isAI ? s.bubbleAI : s.bubbleUser]}>
        <Text style={[s.bubbleTxt, isAI ? s.bubbleTxtAI : s.bubbleTxtUser]}>
          {msg.text}
        </Text>
        {msg.showDiag && <DiagCard />}
        <Text style={[s.bubbleTime, !isAI && { color: 'rgba(255,255,255,0.45)' }]}>
          {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Pulse Dot ────────────────────────────────────────────────
const PulseDot = () => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: 'rgba(5,150,105,0.25)',
        transform: [{ scale }],
      }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.emerald }} />
    </View>
  );
};

// ══ MAIN SCREEN ══════════════════════════════════════════════
const AiChat = ({ navigation }) => {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [activeChip, setActiveChip]   = useState(null);
  const [activeMedia, setActiveMedia] = useState(null);
  const [chatMode, setChatMode]       = useState(false);
  const scrollRef = useRef(null);

  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const onShow = (e) => setKbHeight(e.endCoordinates.height);
    const onHide = ()  => setKbHeight(0);
    const s1 = Keyboard.addListener('keyboardWillShow', onShow);
    const s2 = Keyboard.addListener('keyboardWillHide', onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const clearChat = () => {
    setMessages([]); setInput(''); setTyping(false);
    setActiveChip(null); setActiveMedia(null); setChatMode(false);
  };

  const scrollBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

  const send = (overrideText) => {
    const txt = (overrideText ?? input).trim();
    if (!txt) return;
    if (!chatMode) setChatMode(true);
    const userMsg = { id: `u${Date.now()}`, role: 'user', ts: new Date(), text: txt };
    setMessages(p => [...p, userMsg]);
    setInput(''); setActiveChip(null);
    scrollBottom(); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const low = txt.toLowerCase();
      let ai = { id: `a${Date.now()}`, role: 'ai', ts: new Date(), text: '', showDiag: false };
      if (low.includes('ac') || low.includes('cool') || low.includes('refriger')) {
        ai.text = 'Diagnosis complete — here\'s what I found:'; ai.showDiag = true;
      } else if (low.includes('leak') || low.includes('pipe') || low.includes('water')) {
        ai.text = '🔍 Detected: Loose pipe joint at elbow connector\n📍 Severity: Moderate\n💰 Estimated cost: ₹400 – ₹900\n\nRecommend booking a plumber within 48 hours.';
      } else if (low.includes('noise') || low.includes('sound')) {
        ai.text = '🔊 Noise analysis:\n\n• Loose motor bearing (78% probability)\n• Foreign debris in fan (15%)\n\n💰 Estimated: ₹600 – ₹1,200';
      } else if (low.includes('power') || low.includes('electric') || low.includes('trip')) {
        ai.text = '⚡ Power issue detected:\n\n• Tripped MCB / circuit breaker (high confidence)\n• Check your distribution board first\n\n💰 If wiring fault: ₹300 – ₹800';
      } else {
        ai.text = 'To give a precise diagnosis, please share:\n\n• Which appliance is affected?\n• How long has this been happening?\n• Any unusual smells or error codes?';
      }
      setMessages(p => [...p, ai]);
      scrollBottom();
    }, 2000);
  };

  const onChipPress = (chip) => {
    setActiveChip(chip.id);
    setInput(chip.label);
    setTimeout(() => send(chip.label), 50);
  };

  return (
    // White header, cream body, dark status bar icons
    <ScreenWrapper
      topColor={T.bgElevated}
      bottomColor={T.bgBase}
      statusBarStyle="dark-content"
    >
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
         
          <View>
            <Text style={s.headerTitle}>AI Diagnosis</Text>
            <View style={s.headerStatusRow}>
              <PulseDot />
              <Text style={s.headerStatusTxt}>Online · Powered by TrustFix AI</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[s.clearBadge, !chatMode && s.clearBadgeDisabled]}
          onPress={chatMode ? clearChat : undefined}
          activeOpacity={chatMode ? 0.75 : 1}
        >
          <Text style={s.clearIcon}>🗑️</Text>
          <Text style={[s.clearTxt, !chatMode && s.clearTxtDisabled]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* BODY — paddingBottom shifts with keyboard on iOS only */}
      <View style={[s.body, { paddingBottom: kbHeight }]}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!chatMode ? (
            <>
              <View style={s.uploadCard}>
                <View style={s.cameraWrap}>
                  <View style={s.cameraBody}>
                    <View style={s.cameraTopBump} />
                    <View style={s.cameraLens}>
                      <View style={s.cameraLensInner} />
                    </View>
                    <View style={s.cameraFlash} />
                  </View>
                </View>
                <Text style={s.uploadTitle}>Show Us the Problem</Text>
                <Text style={s.uploadSub}>Photo, video or audio — AI will diagnose it</Text>
                <View style={s.mediaPills}>
                  {MEDIA.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.mediaPill, activeMedia === m.id && s.mediaPillActive]}
                      onPress={() => setActiveMedia(m.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.mediaPillIcon}>{m.icon}</Text>
                      <Text style={[s.mediaPillTxt, activeMedia === m.id && s.mediaPillTxtActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.chipsWrap}>
                {CHIPS.map(chip => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[s.chip, activeChip === chip.id && s.chipActive]}
                    onPress={() => onChipPress(chip)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.chipIcon}>{chip.icon}</Text>
                    <Text style={[s.chipTxt, activeChip === chip.id && s.chipTxtActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.orLabel}>Or describe it below ↓</Text>
            </>
          ) : (
            <View style={s.chatArea}>
              {messages.map(m => <Bubble key={m.id} msg={m} />)}
              {typing && <TypingDots />}
            </View>
          )}
        </ScrollView>

        {/* PINNED BOTTOM BAR */}
        <View style={s.bottomBar}>
          <View style={s.inputRow}>
            <TouchableOpacity style={s.attachBtn} onPress={() => setActiveMedia('photo')}>
              <Text style={s.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={s.inputField}
              placeholder="Type what's happening..."
              placeholderTextColor={T.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={300}
              returnKeyType="send"
            />
            {input.trim().length > 0 ? (
              <TouchableOpacity style={s.sendBtn} onPress={() => send()}>
                <Text style={s.sendBtnTxt}>↑</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.micBtn}>
                <Text style={s.micIcon}>🎙️</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.ctaBtn} onPress={() => send()} activeOpacity={0.88}>
            <Text style={s.ctaIcon}>🤖</Text>
            <Text style={s.ctaTxt}>Diagnose Now</Text>
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
const s = StyleSheet.create({
  body: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
    backgroundColor: T.bgElevated,
    borderBottomWidth: 1, borderBottomColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: T.bgFloat,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backArrow: { fontSize: 22, color: T.textPrimary, lineHeight: 26, marginTop: -2 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: T.violetSoft, borderWidth: 1, borderColor: T.violetBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.textPrimary, letterSpacing: -0.3 },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerStatusTxt: { fontSize: 10, color: T.textTertiary, fontWeight: '500' },
  clearBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(225,29,72,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(225,29,72,0.22)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  clearBadgeDisabled: { backgroundColor: T.bgFloat, borderColor: T.border, opacity: 0.45 },
  clearIcon: { fontSize: 13 },
  clearTxt: { color: '#E11D48', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  clearTxtDisabled: { color: T.textTertiary },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 16 },

  uploadCard: {
    borderWidth: 2, borderColor: T.violetDash, borderStyle: 'dashed',
    borderRadius: 22, backgroundColor: T.violetSoft,
    paddingVertical: 28, paddingHorizontal: 20,
    alignItems: 'center', marginBottom: 16,
  },
  cameraWrap: { width: 68, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  cameraBody: {
    width: 58, height: 44, backgroundColor: '#B2AEC0',
    borderRadius: 11, justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  cameraTopBump: {
    position: 'absolute', top: -8, left: 9,
    width: 18, height: 10, backgroundColor: '#B2AEC0', borderRadius: 5,
  },
  cameraLens: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#7E7A8E',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#9490A4',
  },
  cameraLensInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#59566A' },
  cameraFlash: {
    position: 'absolute', top: 8, right: 9,
    width: 9, height: 6, borderRadius: 3, backgroundColor: '#9490A4',
  },
  uploadTitle: { fontSize: 18, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.4, marginBottom: 5 },
  uploadSub: { fontSize: 13, color: T.textSecondary, marginBottom: 20, textAlign: 'center', lineHeight: 18 },
  mediaPills: { flexDirection: 'row', gap: 8 },
  mediaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11,
    backgroundColor: T.bgCard, borderWidth: 1.5, borderColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  mediaPillActive: { backgroundColor: T.violetMid, borderColor: T.violet },
  mediaPillIcon: { fontSize: 14 },
  mediaPillTxt: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  mediaPillTxtActive: { color: T.violet },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100,
    backgroundColor: T.violetSoft, borderWidth: 1.5, borderColor: T.violetBorder,
    minWidth: (W - 32 - 9) / 2 - 0.5, justifyContent: 'center',
  },
  chipActive: { backgroundColor: T.violetMid, borderColor: T.violet },
  chipIcon: { fontSize: 13 },
  chipTxt: { fontSize: 13, fontWeight: '600', color: T.violet },
  chipTxtActive: { color: T.violet, fontWeight: '700' },
  orLabel: { fontSize: 13, color: T.textTertiary, fontWeight: '500', textAlign: 'center', marginTop: 4 },

  chatArea: { paddingTop: 4 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleLeft:  { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  aiBadge: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: T.violetSoft, borderWidth: 1, borderColor: T.violetBorder,
    justifyContent: 'center', alignItems: 'center', marginRight: 8, flexShrink: 0,
  },
  aiBadgeTxt: { fontSize: 8, fontWeight: '900', color: T.violet },
  bubble: { maxWidth: '78%', borderRadius: 20, padding: 13 },
  bubbleAI: {
    backgroundColor: T.bgCard, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  bubbleUser: { backgroundColor: T.violet, borderBottomRightRadius: 4 },
  bubbleTxt: { fontSize: 14, lineHeight: 21 },
  bubbleTxtAI:   { color: T.textPrimary },
  bubbleTxtUser: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, marginTop: 5, color: T.textTertiary, textAlign: 'right' },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.bgCard, borderRadius: 20, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 16, paddingVertical: 14, gap: 5,
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.violet },

  diagCard: {
    marginTop: 12, backgroundColor: T.bgFloat,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: T.border,
  },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  confNum: { fontSize: 36, fontWeight: '800', color: T.violet, letterSpacing: -1 },
  confTime: { fontSize: 18, fontWeight: '700', color: T.textPrimary, textAlign: 'right' },
  confLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.textTertiary, marginTop: 2 },
  issueBox: {
    backgroundColor: T.bgCard2, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: T.border, marginBottom: 12,
  },
  issueLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.textTertiary, marginBottom: 4 },
  issueVal: { fontSize: 13, fontWeight: '700', color: T.textPrimary, lineHeight: 19 },
  sevLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.textTertiary, marginBottom: 6 },
  sevBar: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  sevSeg: { flex: 1, height: 7, borderRadius: 4 },
  sevFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sevMin:  { fontSize: 9, color: T.textTertiary },
  sevMid:  { fontSize: 9, color: T.amber, fontWeight: '800' },
  sevCrit: { fontSize: 9, color: T.textTertiary },
  divider: { height: 1, backgroundColor: T.border, marginBottom: 12 },
  costLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: T.textTertiary, marginBottom: 4 },
  costValue: { fontSize: 26, fontWeight: '800', color: T.coral, letterSpacing: -0.5 },
  costSub: { fontSize: 11, color: T.textTertiary, marginBottom: 14 },
  bookBtn: {
    backgroundColor: T.coral, borderRadius: 13, paddingVertical: 13,
    alignItems: 'center', marginBottom: 8,
    shadowColor: T.coral, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  bookBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  diagBtnRow: { flexDirection: 'row', gap: 8 },
  ghostBtn: {
    borderRadius: 11, paddingVertical: 11, alignItems: 'center',
    backgroundColor: T.coralTint, borderWidth: 1, borderColor: T.coralBorder,
  },
  ghostBtnTxt: { color: T.coral, fontWeight: '600', fontSize: 12 },
  surfBtn: {
    borderRadius: 11, paddingVertical: 11, alignItems: 'center',
    backgroundColor: T.bgCard2, borderWidth: 1, borderColor: T.border,
  },
  surfBtnTxt: { color: T.textSecondary, fontWeight: '600', fontSize: 12 },

  bottomBar: {
    backgroundColor: T.bgElevated,
    borderTopWidth: 1, borderTopColor: T.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: T.bgCard2, borderRadius: 16,
    borderWidth: 1.5, borderColor: T.border,
    paddingHorizontal: 6, paddingVertical: 6, marginBottom: 10, gap: 6,
  },
  attachBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  attachIcon: { fontSize: 18 },
  inputField: {
    flex: 1, fontSize: 14, color: T.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 36, maxHeight: 100, lineHeight: 20,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: T.violet,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: T.violet, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  sendBtnTxt: { color: '#FFF', fontSize: 17, fontWeight: '800', marginTop: -1 },
  micBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: T.bgFloat, justifyContent: 'center', alignItems: 'center' },
  micIcon: { fontSize: 17 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: T.coral, borderRadius: 16, paddingVertical: 16,
    shadowColor: T.coral, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 7,
  },
  ctaIcon: { fontSize: 20 },
  ctaTxt: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});