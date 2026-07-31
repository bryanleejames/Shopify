import SwiftUI

// MARK: - Onboarding View
/// Entry point for the auth flow.
/// Shows splash/logo then transitions to auth form (signup or login).
struct OnboardingView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var showAuthForm = false
    @State private var splashAnimation = false

    var body: some View {
        VStack {
            if !showAuthForm {
                splashContent
                    .transition(.opacity)
            } else {
                AuthFormView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .leading)
                    ))
            }
        }
        .background(DesignSystem.Colors.background)
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) {
                splashAnimation = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation(.easeInOut(duration: 0.4)) {
                    showAuthForm = true
                }
            }
        }
        .environment(authViewModel)
    }

    private var splashContent: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            Spacer()

            // Logo mark
            ZStack {
                Circle()
                    .fill(DesignSystem.Colors.primary)
                    .frame(width: 100, height: 100)

                Image(systemName: "bolt.fill")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundColor(.white)
                    .rotationEffect(.degrees(splashAnimation ? 15 : -15))
            }
            .scaleEffect(splashAnimation ? 1.0 : 0.5)
            .opacity(splashAnimation ? 1.0 : 0.0)

            Text("FluxPay")
                .font(DesignSystem.Typography.largeTitle)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .opacity(splashAnimation ? 1.0 : 0.0)

            Text("Money, instantly.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
                .opacity(splashAnimation ? 1.0 : 0.0)

            Spacer()
        }
    }
}
