import UIKit

// MARK: - App Delegate
/// UIKit lifecycle delegate for FluxPay.
///
/// Wired into the SwiftUI lifecycle via `@UIApplicationDelegateAdaptor` in
/// `FluxPayApp`. Handles APNs remote-notification callbacks and forwards them
/// to `PushNotificationService`.
final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        PushNotificationService.shared.configure()

        // If the user is already signed in on a fresh launch, refresh the APNs
        // token (tokens can rotate). The backend registration is idempotent.
        if KeychainService.shared.load(key: KeychainService.Keys.authToken) != nil {
            PushNotificationService.shared.registerForRemoteNotifications()
        }

        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        PushNotificationService.shared.handleDeviceToken(deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        PushNotificationService.shared.handleRegistrationError(error)
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        // Standard alert/badge/sound notifications are delivered by the system;
        // this hook is provided for future silent/data-payload handling.
        completionHandler(.newData)
    }
}
