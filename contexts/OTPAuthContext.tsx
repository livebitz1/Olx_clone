// =============================================================================
// OTPAuthContext - Firebase Phone Authentication
// =============================================================================
// This file re-exports the Firebase Auth implementation
// The old MSG91 implementation has been replaced with Firebase for:
// - Cross-platform support (Android, iOS, Web)
// - Better reliability and scalability
// - No CORS issues on web
// - Free tier with 10,000 SMS/month
// =============================================================================

// Re-export everything from FirebaseAuthContext
export { AuthProvider, useAuth } from './FirebaseAuthContext';
