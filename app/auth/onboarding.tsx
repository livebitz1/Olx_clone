import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/auth/login');
    };

    const renderWaves = () => {
        // High-precision Sigmoid Curve: Sweeping even more aggressively upwards to touch 'fast'
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
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {renderWaves()}

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <Text style={styles.title}>
                        Discover{"\n"}nearby{"\n"}buyers and{"\n"}sellers fast
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGetStarted}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={styles.arrowIcon} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    designContainer: {
        position: 'absolute',
        bottom: 20, // Shifted down by 100px from 120
        left: -100,
        width: SCREEN_WIDTH + 200,
        height: 650,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: SCREEN_HEIGHT * 0.04,
    },
    title: {
        fontSize: 68,
        fontWeight: '900',
        color: '#FF4D00',
        lineHeight: 74,
        letterSpacing: -1.5,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    button: {
        backgroundColor: '#FF4D00',
        borderRadius: 20,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
        shadowColor: '#FF4D00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 10,
    },
    arrowIcon: {
        marginLeft: 5,
    },
});
