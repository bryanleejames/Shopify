import Foundation
import SwiftUI

// MARK: - Biometric ViewModel
/// Manages app lock state and biometric preferences.
@MainActor
@Observable
final class BiometricViewModel {
    var isLocked = false
    var isAuthenticating = false
    var authFailed = false

    private let biometricService = BiometricAuthService.shared

    var biometryTypeName: String {
        biometricService.biometryName
    }

    var isBiometricsAvailable: Bool {
        biometricService.isAvailable
    }

    var isBiometricsEnabled: Bool {
        get { biometricService.isEnabled }
        set { biometricService.isEnabled = newValue }
    }

    /// Lock the app (called when going to background)
    func lock() {
        guard isBiometricsEnabled else { return }
        isLocked = true
        authFailed = false
    }

    /// Attempt to unlock with biometrics
    func unlock() async -> Bool {
        guard isLocked, isBiometricsEnabled else {
            isLocked = false
            return true
        }

        isAuthenticating = true
        authFailed = false

        let success = await biometricService.authenticate()

        if success {
            isLocked = false
            isAuthenticating = false
            return true
        } else {
            authFailed = true
            isAuthenticating = false
            return false
        }
    }
}