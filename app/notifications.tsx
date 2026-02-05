import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function NotificationsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            {/* Content Area - Empty State */}
            <View style={styles.content}>
                <View style={styles.emptyStateContainer}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name="notifications-outline" size={80} color="#A0A0A0" />
                    </View>

                    <Text style={styles.title}>You haven’t gotten any notifications yet!</Text>
                    <Text style={styles.subtitle}>
                        We’ll alert you when something cool happens.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: Platform.OS === 'android' ? 10 : 0,
    },
    closeButton: {
        padding: 4,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000000',
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80, // Push center content slightly up
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconWrapper: {
        marginBottom: 40,
        opacity: 0.6,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 30,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});
