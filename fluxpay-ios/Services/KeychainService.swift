import Foundation
import Security

// MARK: - Keychain Service
/// Secure storage for sensitive data using iOS Keychain.
/// Falls back to UserDefaults if Keychain is unavailable (e.g., in sandbox or testing).
final class KeychainService {
    static let shared = KeychainService()

    private let serviceName = "io.fluxpay.app"
    private let userDefaults: UserDefaults = .standard
    private let userDefaultsPrefix = "keychain_fallback_"

    private init() {}

    // MARK: - Save
    /// Save a string to Keychain. Returns true on success.
    @discardableResult
    func save(key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }

        // Delete any existing item first
        delete(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        if status == errSecSuccess {
            return true
        }

        // If Keychain fails, fall back to UserDefaults
        print("[KeychainService] Keychain save failed with status \(status), falling back to UserDefaults")
        saveToUserDefaults(key: key, value: value)
        return false
    }

    // MARK: - Load
    /// Load a string from Keychain. Returns nil if not found.
    func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8) {
            return value
        }

        // Fall back to UserDefaults
        return loadFromUserDefaults(key: key)
    }

    // MARK: - Delete
    /// Delete a string from Keychain.
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
        ]

        SecItemDelete(query as CFDictionary)

        // Also clean up UserDefaults fallback
        userDefaults.removeObject(forKey: userDefaultsPrefix + key)
    }

    // MARK: - UserDefaults Fallback
    private func saveToUserDefaults(key: String, value: String) {
        userDefaults.set(value, forKey: userDefaultsPrefix + key)
    }

    private func loadFromUserDefaults(key: String) -> String? {
        userDefaults.string(forKey: userDefaultsPrefix + key)
    }
}

// MARK: - Keychain Keys
extension KeychainService {
    enum Keys {
        static let authToken = "auth_token"
    }
}