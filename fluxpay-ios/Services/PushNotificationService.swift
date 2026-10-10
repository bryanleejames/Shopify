import Foundation
import UIKit
import UserNotifications

// MARK: - Push Notification Service
/// Manages push notification permission, APNs device-token registration,
/// and syncing the token with the FluxPay backend
/// (`POST /notifications/register` / `POST /notifications/unregister`).
///
/// The device token is persisted to Keychain so it survives relaunches and
/// can be unregistered on logout (the backend matches on `user_id + token`).
final class PushNotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotificationService()

    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared

    /// Last APNs device token (hex string), if one has been issued.
    private(set) var deviceToken: String?

    private override init() {
        super.init()
        deviceToken = keychain.load(key: KeychainService.Keys.deviceToken)
    }

    // MARK: - Configuration
    /// Set ourselves as the notification-center delegate so notifications
    /// render (banner/sound/badge) even when the app is in the foreground.
    func configure() {
        UNUserNotificationCenter.current().delegate = self
    }

    // MARK: - Permission & APNs Registration
    /// Request push permission and register this device with APNs.
    /// Called after a successful login/signup. Idempotent: if permission was
    /// already granted, the system returns immediately without re-prompting.
    func requestPermissionAndRegister() async {
        let center = UNUserNotificationCenter.current()

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            if granted {
                registerForRemoteNotifications()
            } else {
                print("[Push] Notification permission denied by user")
            }
        } catch {
            print("[Push] Failed to request notification permission: \(error.localizedDescription)")
        }
    }

    /// Ask APNs for a (possibly refreshed) device token.
    /// Safe to call from any thread; dispatches to main when required.
    func registerForRemoteNotifications() {
        if Thread.isMainThread {
            UIApplication.shared.registerForRemoteNotifications()
        } else {
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    // MARK: - AppDelegate Callbacks
    /// Handle the raw APNs device token, convert to hex, persist it, and
    /// sync it to the backend (idempotent on the server).
    func handleDeviceToken(_ deviceTokenData: Data) {
        let token = deviceTokenData.map { String(format: "%02x", $0) }.joined()
        deviceToken = token
        keychain.save(key: KeychainService.Keys.deviceToken, value: token)

        Task {
            do {
                _ = try await apiClient.registerDeviceToken(token, platform: "ios")
                print("[Push] Device token registered with backend")
            } catch {
                print("[Push] Backend registration failed: \(error.localizedDescription)")
            }
        }
    }

    /// Handle an APNs registration failure (e.g. running in the simulator).
    func handleRegistrationError(_ error: Error) {
        print("[Push] APNs registration failed: \(error.localizedDescription)")
    }

    // MARK: - Unregister
    /// Remove the device token from the backend. Call on logout BEFORE the
    /// auth token is cleared. Best-effort: never throws, always clears local state.
    func unregister() async {
        let token = deviceToken

        if let token {
            do {
                _ = try await apiClient.unregisterDeviceToken(token)
                print("[Push] Device token unregistered from backend")
            } catch {
                print("[Push] Backend unregister failed: \(error.localizedDescription)")
            }
        }

        deviceToken = nil
        keychain.delete(key: KeychainService.Keys.deviceToken)
    }

    // MARK: - UNUserNotificationCenterDelegate
    /// Present notifications even when the app is in the foreground.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .list, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }
}
