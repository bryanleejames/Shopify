import SwiftUI

@main
struct FluxPayApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var authViewModel = AuthViewModel()
    @State private var biometricVM = BiometricViewModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ZStack {
                if authViewModel.isAuthenticated {
                    MainTabView()
                        .environment(authViewModel)
                } else {
                    OnboardingView()
                        .environment(authViewModel)
                }

                // Biometric lock overlay
                if biometricVM.isLocked {
                    biometricLockOverlay
                }
            }
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .inactive, .background:
                    // Lock the app when it goes to background
                    biometricVM.lock()
                case .active:
                    // Attempt unlock when app becomes active
                    Task {
                        await biometricVM.unlock()
                    }
                @unknown default:
                    break
                }
            }
        }
    }

    // MARK: - Biometric Lock Overlay
    private var biometricLockOverlay: some View {
        ZStack {
            // Blurred background
            Color(DesignSystem.Colors.background)
                .ignoresSafeArea()

            // Semi-transparent overlay to hide content
            Rectangle()
                .fill(.ultraThinMaterial)
                .ignoresSafeArea()

            VStack(spacing: DesignSystem.Spacing.xl) {
                Spacer()

                // App icon
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(DesignSystem.Colors.primary)
                        .frame(width: 72, height: 72)

                    Image(systemName: "bolt.fill")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                }

                // App name
                Text("FluxPay")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                // Lock icon
                Image(systemName: biometricVM.biometryTypeName == "Face ID" ? "faceid" : "touchid")
                    .font(.system(size: 40))
                    .foregroundColor(DesignSystem.Colors.primary)

                // Unlock button
                FluxButton(
                    title: biometricVM.isAuthenticating
                        ? "Authenticating..."
                        : biometricVM.authFailed
                        ? "Try Again"
                        : "Unlock with \(biometricVM.biometryTypeName)",
                    icon: biometricVM.isAuthenticating
                        ? nil
                        : Image(systemName: biometricVM.biometryTypeName == "Face ID" ? "faceid" : "touchid"),
                    isLoading: biometricVM.isAuthenticating
                ) {
                    Task {
                        let _ = await biometricVM.unlock()
                    }
                }

                if biometricVM.authFailed {
                    Text("Authentication failed. Please try again.")
                        .font(DesignSystem.Typography.footnote)
                        .foregroundColor(DesignSystem.Colors.error)
                }

                Spacer()
            }
            .padding(DesignSystem.Spacing.xl)
        }
    }
}
