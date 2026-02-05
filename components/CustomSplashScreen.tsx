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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomSplashScreenProps {
    onAnimationComplete?: () => void;
}

export default function CustomSplashScreen({ onAnimationComplete }: CustomSplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Rotation animation for the loading spinner
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // After a delay, fade out the splash screen
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
        }, 3000); // Show for 3 seconds

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <StatusBar barStyle="light-content" backgroundColor="#FF4D00" />

            {/* Design Elements: Wavy lines at the top */}
            <View style={styles.designContainer}>
                <View style={[styles.arc, styles.arc1]} />
                <View style={[styles.arc, styles.arc2]} />
                <View style={[styles.arc, styles.arc3]} />
                <View style={[styles.arc, styles.arc4]} />
            </View>

            {/* Center Logo/Text */}
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Abhibecho</Text>
            </View>

            {/* Bottom Loading Indicator */}
            <View style={styles.loaderContainer}>
                <Animated.View
                    style={[
                        styles.spinner,
                        { transform: [{ rotate: spin }] }
                    ]}
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FF4D00',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
    },
    designContainer: {
        position: 'absolute',
        top: -SCREEN_HEIGHT * 0.25,
        left: -SCREEN_WIDTH * 0.4,
        width: SCREEN_WIDTH * 2,
        height: SCREEN_HEIGHT * 0.8,
    },
    arc: {
        position: 'absolute',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.45)',
        borderRadius: 2000,
    },
    arc1: {
        width: SCREEN_WIDTH * 1.8,
        height: SCREEN_WIDTH * 1.8,
        top: 50,
        left: 50,
    },
    arc2: {
        width: SCREEN_WIDTH * 1.8,
        height: SCREEN_WIDTH * 1.8,
        top: 100,
        left: 100,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    arc3: {
        width: SCREEN_WIDTH * 1.8,
        height: SCREEN_WIDTH * 1.8,
        top: 150,
        left: 150,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    arc4: {
        width: SCREEN_WIDTH * 1.8,
        height: SCREEN_WIDTH * 1.8,
        top: 200,
        left: 200,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderTopColor: '#FFFFFF',
    },
});
