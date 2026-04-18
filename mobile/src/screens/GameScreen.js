import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GameScreen = () => {
  const [progress, setProgress] = useState(0.5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null); // null | 'LEFT' | 'RIGHT'

  // We drive rotation as plain degrees (unbounded) and interpolate over a
  // matching unbounded range so it never resets to 0.
  const rotationValue = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0); // tracks the true accumulated degrees

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    const outcome = Math.random() < 0.5 ? 'RIGHT' : 'LEFT';
    // RIGHT → lands pointing right (multiple of 360°)
    // LEFT  → lands pointing left  (multiple of 360° + 180°)
    const landingOffset = outcome === 'RIGHT' ? 0 : 180;
    const extraSpins = (4 + Math.floor(Math.random() * 4)) * 360;
    const target = currentDeg.current + extraSpins + landingOffset;

    Animated.timing(rotationValue, {
      toValue: target,
      duration: 2800 + Math.random() * 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentDeg.current = target;
      setIsSpinning(false);
      setResult(outcome);
    });
  };

  // Interpolate over a huge unbounded range — no wrapping, no snap.
  const rotateDeg = rotationValue.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  const resultColor =
    result === 'LEFT' ? '#C0392B' : result === 'RIGHT' ? '#27AE60' : '#7A6651';

  return (
    <View style={styles.container}>

      {/* Result / idle label */}
      <View style={styles.resultContainer}>
        <Text style={[styles.resultText, { color: resultColor }]}>
          {result ?? (isSpinning ? '…' : 'TAP TO SPIN')}
        </Text>
      </View>

      {/* Spinner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={spin}
        style={styles.spinnerWrapper}
        disabled={isSpinning}
      >
        <View style={styles.outerRing}>
          <View style={styles.innerCircle}>
            <Animated.View
              style={[
                styles.arrowContainer,
                { transform: [{ rotate: rotateDeg }] },
              ]}
            >
              {/* Blunt tail (left side) */}
              <View style={styles.tail} />
              {/* Shaft */}
              <View style={styles.shaft} />
              {/* Arrowhead pointing RIGHT */}
              <View style={styles.arrowHead} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Progress Bar — untouched */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

const SHAFT_W = 100;
const SHAFT_H = 10;
const HEAD_W = 22;
const HEAD_H = 30;
const TAIL_W = 10;
const TAIL_H = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    marginBottom: 36,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  spinnerWrapper: {
    alignItems: 'center',
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#D4A96A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,169,106,0.08)',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  innerCircle: {
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: '#FFF8ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8C88A',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    width: TAIL_W,
    height: TAIL_H,
    backgroundColor: '#2C1F14',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  shaft: {
    width: SHAFT_W,
    height: SHAFT_H,
    backgroundColor: '#2C1F14',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: HEAD_H / 2,
    borderBottomWidth: HEAD_H / 2,
    borderLeftWidth: HEAD_W,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2C1F14',
  },
  // Progress bar — untouched
  progressBarContainer: {
    position: 'absolute',
    bottom: 40,
    width: '80%',
    height: 20,
    backgroundColor: '#E0D0B0',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4A96A',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C1F14',
    lineHeight: 18,
  },
});

export default GameScreen;
