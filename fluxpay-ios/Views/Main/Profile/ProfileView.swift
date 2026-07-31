import SwiftUI

// MARK: - Profile View
/// User profile and settings with subscription tier, edit display name, and navigation.
struct ProfileView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var profileVM = ProfileViewModel()
    @State private var showSignOutConfirmation = false
    @State private var showSubscription = false

    var body: some View {
        NavigationStack {
            List {
                // User Info Section
                Section {
                    HStack(spacing: DesignSystem.Spacing.md) {
                        ZStack {
                            Circle()
                                .fill(DesignSystem.Colors.primaryLight)
                                .frame(width: 64, height: 64)

                            Text(userInitial)
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(DesignSystem.Colors.primary)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(authViewModel.currentUser?.fullName ?? "FluxPay User")
                                    .font(DesignSystem.Typography.headline)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)

                                // Subscription badge
                                if profileVM.subscription?.isPremium == true {
                                    premiumBadge
                                } else {
                                    freeBadge
                                }
                            }

                            Text(authViewModel.currentUser?.email ?? "")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }

                        Spacer()

                        // Edit name button
                        Button(action: {
                            profileVM.editedDisplayName = authViewModel.currentUser?.fullName ?? ""
                            profileVM.isEditingName = true
                        }) {
                            Image(systemName: "pencil.circle.fill")
                                .font(.system(size: 20))
                                .foregroundColor(DesignSystem.Colors.primary)
                        }
                    }
                    .padding(.vertical, DesignSystem.Spacing.sm)
                }

                // Edit Name Section (shown when editing)
                if profileVM.isEditingName {
                    Section("Edit Display Name") {
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            TextField("Display Name", text: $profileVM.editedDisplayName)
                                .font(DesignSystem.Typography.body)
                                .textFieldStyle(.roundedBorder)

                            if let error = profileVM.errorMessage {
                                Text(error)
                                    .font(DesignSystem.Typography.footnote)
                                    .foregroundColor(DesignSystem.Colors.error)
                            }

                            HStack(spacing: DesignSystem.Spacing.sm) {
                                FluxButton(
                                    title: "Save",
                                    isLoading: profileVM.isSavingName,
                                    isDisabled: profileVM.editedDisplayName.trimmingCharacters(in: .whitespaces).isEmpty
                                ) {
                                    Task {
                                        if let updatedUser = await profileVM.saveDisplayName() {
                                            authViewModel.currentUser = updatedUser
                                        }
                                    }
                                }

                                FluxButton(
                                    title: "Cancel",
                                    style: .ghost,
                                    action: { profileVM.isEditingName = false }
                                )
                            }
                        }
                    }
                }

                // Subscription / Premium
                Section("Plan") {
                    Button(action: { showSubscription = true }) {
                        HStack(spacing: DesignSystem.Spacing.md) {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 18))
                                .foregroundColor(DesignSystem.Colors.warning)
                                .frame(width: 24)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(profileVM.subscription?.isPremium == true ? "Manage Subscription" : "Go Premium")
                                    .font(DesignSystem.Typography.headline)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)

                                Text(profileVM.subscription?.isPremium == true
                                    ? "Premium — \(profileVM.subscription?.formattedLimit ?? "$10,000")/wk limit"
                                    : "Higher limits, early deposit, budgeting tools")
                                    .font(DesignSystem.Typography.footnote)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                            }

                            Spacer()

                            Text(profileVM.subscription?.isPremium == true ? "Active" : "$4.99/mo")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(profileVM.subscription?.isPremium == true
                                    ? DesignSystem.Colors.accent
                                    : DesignSystem.Colors.textTertiary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(profileVM.subscription?.isPremium == true
                                    ? DesignSystem.Colors.accent.opacity(0.1)
                                    : DesignSystem.Colors.surface)
                                .cornerRadius(DesignSystem.Radius.sm)

                            Image(systemName: "chevron.right")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }
                        .padding(.vertical, 2)
                    }
                    .buttonStyle(.plain)
                }

                // Payment Methods
                Section("Payment Methods") {
                    profileRow(icon: "creditcard.fill", title: "Debit Card", subtitle: "Not linked")
                    profileRow(icon: "building.columns.fill", title: "Bank Account", subtitle: "Not linked")
                    profileRow(icon: "plus.circle.fill", title: "Add Payment Method", showChevron: true)
                }

                // Settings
                Section("Settings") {
                    profileRow(icon: "bell.fill", title: "Notifications")
                    profileRow(icon: "lock.fill", title: "Privacy & Security")
                    profileRow(icon: "faceid", title: "Face ID / Passcode")
                    profileRow(icon: "questionmark.circle.fill", title: "Help & Support")
                }

                // Sign Out
                Section {
                    Button(role: .destructive) {
                        showSignOutConfirmation = true
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                                .font(DesignSystem.Typography.headline)
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .confirmationDialog(
                "Are you sure you want to sign out?",
                isPresented: $showSignOutConfirmation,
                titleVisibility: .visible
            ) {
                Button("Sign Out", role: .destructive) {
                    authViewModel.signOut()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("You'll need to sign in again with your email and password.")
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .task {
                await profileVM.loadSubscription()
            }
            // Refresh subscription when sheet dismisses
            .onChange(of: showSubscription) { _, isShowing in
                if !isShowing {
                    Task { await profileVM.loadSubscription() }
                }
            }
        }
    }

    // MARK: - Badges
    private var premiumBadge: some View {
        HStack(spacing: 2) {
            Image(systemName: "crown.fill")
                .font(.system(size: 10))
            Text("Premium")
                .font(DesignSystem.Typography.caption)
                .fontWeight(.semibold)
        }
        .foregroundColor(DesignSystem.Colors.warning)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(DesignSystem.Colors.warning.opacity(0.1))
        .cornerRadius(DesignSystem.Radius.sm)
    }

    private var freeBadge: some View {
        HStack(spacing: 2) {
            Text("Free")
                .font(DesignSystem.Typography.caption)
                .fontWeight(.semibold)
        }
        .foregroundColor(DesignSystem.Colors.textTertiary)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.sm)
    }

    /// First letter of the user's full name, or "?" if unknown
    private var userInitial: String {
        guard let name = authViewModel.currentUser?.fullName, !name.isEmpty else {
            return "?"
        }
        return String(name.prefix(1)).uppercased()
    }

    private func profileRow(icon: String, title: String, subtitle: String? = nil, showChevron: Bool = false) -> some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(DesignSystem.Colors.primary)
                .frame(width: 24)

            Text(title)
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textPrimary)

            if let subtitle = subtitle {
                Spacer()
                Text(subtitle)
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }

            if showChevron {
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(DesignSystem.Colors.textTertiary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview("Profile View") {
    ProfileView()
        .environment(AuthViewModel())
}