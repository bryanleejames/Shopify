import Foundation
import LocalAuthentication

// MARK: - Biometric Auth Service
/// Manages Face ID / Touch ID authentication for the FluxPay app.
final class BiometricAuthService {
    static let shared = BiometricAuthService()

    private let context = LAContext()
    private let userDefaults = UserDefaults.standard
    private let biometryEnabledKey = "biometric_auth_enabled"

    private init() {}

    // MARK: - Availability
    /// Returns the biometry type available on this device (.faceID, .touchID, or .none)
    var biometryType: LABiometryType {
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        return context.biometryType
    }

    /// Human-readable name for the biometry type
    var biometryName: String {
        switch biometryType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        default:
            return "Biometrics"
        }
    }

    /// Returns true if biometric auth is available on this device
    var isAvailable: Bool {
        var error: NSError?
        let canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return canEvaluate
    }

    /// Returns true if the user has enabled biometric auth in settings
    var isEnabled: Bool {
        get {
            userDefaults.bool(forKey: biometryEnabledKey)
        }
        set {
            userDefaults.set(newValue, forKey: biometryEnabledKey)
        }
    }

    // MARK: - Authenticate
    /// Show the biometric prompt. Returns true if authentication succeeds.
    func authenticate(reason: String = "Authenticate to access FluxPay") async -> Bool {
        guard isAvailable, isEnabled else { return false }

        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"

        return await withCheckedContinuation { continuation in
            context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: reason
            ) { success, error in
                if success {
                    continuation.resume(returning: true)
                } else {
                    if let error = error as? LAError {
                        switch error.code {
                        case .userCancel, .systemCancel, .appCancel:
                            // User cancelled — not an error, just don't unlock
                            break
                        case .userFallback:
                            // User chose passcode fallback — let them in
                            continuation.resume(returning: true)
                            return
                        default:
                            print("[BiometricAuth] Auth failed: \(error.localizedDescription)")
                        }
                    }
                    continuation.resume(returning: false)
                }
            }
        }
    }
}