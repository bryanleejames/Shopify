import SwiftUI

// MARK: - Auth Form View
/// Unified signup / login form with email and password.
struct AuthFormView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @FocusState private var focusedField: Field?

    enum Field {
        case fullName, email, password, confirmPassword
    }

    var body: some View {
        @Bindable var auth = authViewModel

        ScrollView {
            VStack(spacing: DesignSystem.Spacing.xl) {
                Spacer()
                    .frame(height: DesignSystem.Spacing.xxl)

                // Header
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 32))
                        .foregroundColor(DesignSystem.Colors.primary)

                    Text(auth.isSignupMode ? "Create Account" : "Welcome Back")
                        .font(DesignSystem.Typography.title)
                        .foregroundColor(DesignSystem.Colors.textPrimary)

                    Text(auth.isSignupMode
                         ? "Sign up to start sending money instantly"
                         : "Sign in to your account")
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .multilineTextAlignment(.center)
                }

                // Form Fields
                VStack(spacing: DesignSystem.Spacing.md) {
                    // Full Name (signup only)
                    if auth.isSignupMode {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Full Name")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .textCase(.uppercase)

                            HStack {
                                Image(systemName: "person.fill")
                                    .foregroundColor(DesignSystem.Colors.textTertiary)
                                    .frame(width: 20)

                                TextField("Jane Doe", text: $auth.fullName)
                                    .font(DesignSystem.Typography.body)
                                    .textContentType(.name)
                                    .autocorrectionDisabled()
                                    .focused($focusedField, equals: .fullName)
                            }
                            .padding()
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                                    .stroke(focusedField == .fullName ? DesignSystem.Colors.primary : .clear, lineWidth: 2)
                            )
                        }
                    }

                    // Email
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Email")
                            .font(DesignSystem.Typography.footnote)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .textCase(.uppercase)

                        HStack {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                                .frame(width: 20)

                            TextField("you@example.com", text: $auth.email)
                                .font(DesignSystem.Typography.body)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                                .textContentType(.emailAddress)
                                .focused($focusedField, equals: .email)
                        }
                        .padding()
                        .background(DesignSystem.Colors.surface)
                        .cornerRadius(DesignSystem.Radius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                                .stroke(focusedField == .email ? DesignSystem.Colors.primary : .clear, lineWidth: 2)
                        )
                    }

                    // Password
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Password")
                            .font(DesignSystem.Typography.footnote)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .textCase(.uppercase)

                        HStack {
                            Image(systemName: "lock.fill")
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                                .frame(width: 20)

                            SecureField("Minimum 6 characters", text: $auth.password)
                                .font(DesignSystem.Typography.body)
                                .textContentType(auth.isSignupMode ? .newPassword : .password)
                                .focused($focusedField, equals: .password)
                        }
                        .padding()
                        .background(DesignSystem.Colors.surface)
                        .cornerRadius(DesignSystem.Radius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                                .stroke(focusedField == .password ? DesignSystem.Colors.primary : .clear, lineWidth: 2)
                        )
                    }

                    // Confirm Password (signup only)
                    if auth.isSignupMode {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Confirm Password")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .textCase(.uppercase)

                            HStack {
                                Image(systemName: "lock.shield.fill")
                                    .foregroundColor(DesignSystem.Colors.textTertiary)
                                    .frame(width: 20)

                                SecureField("Re-enter password", text: $auth.confirmPassword)
                                    .font(DesignSystem.Typography.body)
                                    .textContentType(.newPassword)
                                    .focused($focusedField, equals: .confirmPassword)
                            }
                            .padding()
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.Radius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                                    .stroke(focusedField == .confirmPassword ? DesignSystem.Colors.primary : .clear, lineWidth: 2)
                            )
                        }
                    }
                }

                // Error
                if let error = auth.errorMessage {
                    Text(error)
                        .font(DesignSystem.Typography.footnote)
                        .foregroundColor(DesignSystem.Colors.error)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                        .transition(.opacity)
                }

                // Submit Button
                FluxButton(
                    title: auth.isSignupMode ? "Create Account" : "Sign In",
                    isLoading: auth.isLoading
                ) {
                    await submit()
                }

                // Toggle Mode
                HStack(spacing: DesignSystem.Spacing.xs) {
                    Text(auth.isSignupMode
                         ? "Already have an account?"
                         : "Don't have an account?")

                    Button(action: { auth.toggleMode() }) {
                        Text(auth.isSignupMode ? "Sign In" : "Sign Up")
                            .fontWeight(.semibold)
                    }
                }
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textSecondary)

                // Footer
                Text("By continuing, you agree to our Terms of Service\nand Privacy Policy.")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.top, DesignSystem.Spacing.sm)
            }
            .padding(.horizontal, DesignSystem.Spacing.lg)
        }
        .background(DesignSystem.Colors.background)
        .onAppear {
            focusedField = auth.isSignupMode ? .fullName : .email
        }
        .onChange(of: auth.isSignupMode) { _, _ in
            focusedField = auth.isSignupMode ? .fullName : .email
        }
    }

    private func submit() async {
        if auth.isSignupMode {
            await auth.signup()
        } else {
            await auth.login()
        }
    }
}

#Preview("Sign Up") {
    AuthFormView()
        .environment(AuthViewModel())
}
