import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LocationPermissionScreen() {
    const router = useRouter();

    const handleAllowLocation = () => {
        // In a real app, we would request permissions here
        // For this mockup implementation, we navigate to the home screen
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Mockup Illustration Container */}
                <View style={styles.illustrationContainer}>
                    {/* Grey Wavy Background Shape */}
                    <View style={styles.wavyBackground}>
                        <View style={[styles.wave, styles.wave1]} />
                        <View style={[styles.wave, styles.wave2]} />
                        <View style={[styles.wave, styles.wave3]} />
                    </View>

                    {/* Location Pin Icon Wrapper */}
                    <View style={styles.pinWrapper}>
                        <View style={styles.pinShadow} />
                        <View style={styles.pinCircle}>
                            <Ionicons name="location" size={80} color="#FF4D00" />
                            <View style={styles.pinInnerCircle} />
                        </View>
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Allow Location</Text>
                    <Text style={styles.subtitle}>
                        You're all set! Explore exciting deals near you.
                    </Text>
                </View>
            </View>

            {/* Action Button at the bottom */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleAllowLocation}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Allow Location</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    illustrationContainer: {
        width: 240,
        height: 240,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    wavyBackground: {
        position: 'absolute',
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wave: {
        position: 'absolute',
        backgroundColor: '#E5E7EB', // Greyish wave color
        borderRadius: 80,
    },
    wave1: {
        width: 180,
        height: 160,
        transform: [{ rotate: '45deg' }],
        opacity: 0.8,
    },
    wave2: {
        width: 170,
        height: 170,
        transform: [{ rotate: '-15deg' }],
        opacity: 0.6,
    },
    wave3: {
        width: 160,
        height: 180,
        transform: [{ rotate: '60deg' }],
    },
    pinWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    pinInnerCircle: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        top: 30,
    },
    pinShadow: {
        position: 'absolute',
        bottom: -10,
        width: 60,
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 100,
        transform: [{ scaleX: 2 }],
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000000',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#808080',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 240,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    },
    button: {
        backgroundColor: '#FF4D00',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
