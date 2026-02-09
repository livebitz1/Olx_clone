import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    Easing,
} from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomSplashScreenProps {
    onAnimationComplete?: () => void;
}

export default function CustomSplashScreen({ onAnimationComplete }: CustomSplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Smooth and steady rotation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }).start(() => {
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [onAnimationComplete, spinAnim, fadeAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const renderWaves = () => {
        // Mirrored high-precision logic from Onboarding for absolute entry-flow consistency
        const pathData = "M -100 500 C 50 500, 150 100, 400 350 S 700 -200, 950 -50";
        const offsets = [0, 40, 80, 120];

        return (
            <View style={styles.designContainer}>
                <Svg height="650" width={SCREEN_WIDTH + 200} viewBox={`0 0 ${SCREEN_WIDTH + 200} 650`}>
                    {offsets.map((offset, i) => (
                        <Path
                            key={i}
                            d={pathData}
                            fill="none"
                            stroke="#FF4D00"
                            strokeWidth="3.2"
                            strokeOpacity={0.75 - i * 0.18}
                            transform={`translate(0, ${offset})`}
                        />
                    ))}
                </Svg>
            </View>
        );
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {renderWaves()}

            {/* Iconic Centered Brand Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Abhibecho</Text>
            </View>

            {/* Custom Fading Tail Gradient Loader */}
            <View style={styles.loaderContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Svg width="56" height="56" viewBox="0 0 56 56">
                        <Defs>
                            <LinearGradient id="tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#FF4D00" stopOpacity="1" />
                                <Stop offset="60%" stopColor="#FF4D00" stopOpacity="0.4" />
                                <Stop offset="100%" stopColor="#FF4D00" stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Path
                            d="M 28 4 A 24 24 0 0 1 52 28"
                            fill="none"
                            stroke="url(#tailGrad)"
                            strokeWidth="6"
                            strokeLinecap="round"
                        />
                    </Svg>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
    },
    designContainer: {
        position: 'absolute',
        top: -120, // Final fine-tuning: Shifted up by another 50px (Total -120)
        left: -100,
        width: SCREEN_WIDTH + 200,
        height: 650,
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20, // Fine-tuned vertical positioning
    },
    logoText: {
        fontSize: 74,
        fontWeight: '900',
        color: '#FF4D00',
        letterSpacing: -3.5, // Absolute compact logo
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 110,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
