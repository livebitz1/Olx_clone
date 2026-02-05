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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/auth/login');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Design Elements: Wavy lines (arcs) */}
            <View style={styles.designContainer}>
                <View style={[styles.arc, styles.arc1]} />
                <View style={[styles.arc, styles.arc2]} />
                <View style={[styles.arc, styles.arc3]} />
            </View>

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
                        <View style={styles.arrowCircle}>
                            <Ionicons name="arrow-forward" size={20} color="#FF4D00" />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF4D00',
    },
    safeArea: {
        flex: 1,
    },
    designContainer: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.2,
        left: -SCREEN_WIDTH * 0.5,
        width: SCREEN_WIDTH * 2,
        height: SCREEN_HEIGHT * 0.8,
    },
    arc: {
        position: 'absolute',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: 1000,
        width: SCREEN_WIDTH * 2.5,
        height: SCREEN_WIDTH * 1.8,
    },
    arc1: {
        top: 50,
        left: 0,
        transform: [{ rotate: '15deg' }],
    },
    arc2: {
        top: 90,
        left: -20,
        transform: [{ rotate: '12deg' }],
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    arc3: {
        top: 130,
        left: -40,
        transform: [{ rotate: '9deg' }],
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: SCREEN_HEIGHT * 0.05,
    },
    title: {
        fontSize: 58,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 64,
        letterSpacing: -1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    },
    button: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        height: 75,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FF4D00',
        marginRight: 10,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
