import SwiftUI

// MARK: - Subscription View
/// Shows current plan (Free vs Premium) with perks and pricing.
struct SubscriptionView: View {
    @State private var viewModel = ProfileViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Hero Section
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 56))
                            .foregroundColor(DesignSystem.Colors.warning)

                        Text("FluxPay Premium")
                            .font(DesignSystem.Typography.title)
                            .foregroundColor(DesignSystem.Colors.textPrimary)

                        Text(viewModel.subscription?.isPremium == true
                            ? "You're on Premium!"
                            : "Unlock the full FluxPay experience")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, DesignSystem.Spacing.xl)

                    // Current Plan Badge
                    HStack {
                        Circle()
                            .fill(viewModel.subscription?.isPremium == true
                                ? DesignSystem.Colors.accent
                                : DesignSystem.Colors.textTertiary)
                            .frame(width: 10, height: 10)

                        Text(viewModel.subscription?.isPremium == true ? "Premium" : "Free")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(viewModel.subscription?.isPremium == true
                                ? DesignSystem.Colors.accent
                                : DesignSystem.Colors.textSecondary)

                        if viewModel.subscription?.isPremium == true {
                            Text("•")
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                            Text("\(viewModel.subscription?.formattedLimit ?? "$5,000")/wk limit")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                    }

                    // Pricing Card
                    if viewModel.subscription?.isPremium != true {
                        pricingCard
                    }

                    // Perks
                    perksSection

                    // Action Button
                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(DesignSystem.Typography.footnote)
                            .foregroundColor(DesignSystem.Colors.error)
                            .multilineTextAlignment(.center)
                    }

                    if viewModel.subscription?.isPremium == true {
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            FluxButton(
                                title: "Cancel Premium",
                                style: .ghost,
                                action: {
                                    Task {
                                        let success = await viewModel.cancelSubscription()
                                        if success {
                                            dismiss()
                                        }
                                    }
                                }
                            )

                            FluxButton(
                                title: "Done",
                                icon: Image(systemName: "checkmark"),
                                action: { dismiss() }
                            )
                        }
                    } else {
                        FluxButton(
                            title: "Upgrade to Premium — $4.99/mo",
                            icon: Image(systemName: "crown.fill"),
                            isLoading: viewModel.isUpgrading,
                            isDisabled: viewModel.isUpgrading
                        ) {
                            let success = await viewModel.upgradeToPremium()
                            if success {
                                // Stay on screen to show "You're on Premium!"
                            }
                        }

                        FluxButton(
                            title: "Not Now",
                            style: .ghost,
                            action: { dismiss() }
                        )
                    }
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundColor(DesignSystem.Colors.primary)
                }
            }
            .task {
                await viewModel.loadSubscription()
            }
        }
        .interactiveDismissDisabled(viewModel.isUpgrading)
    }

    // MARK: - Pricing Card
    private var pricingCard: some View {
        VStack(spacing: DesignSystem.Spacing.sm) {
            Text("$4.99")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundColor(DesignSystem.Colors.textPrimary)

            Text("per month")
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, DesignSystem.Spacing.lg)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.Radius.lg)
                .stroke(DesignSystem.Colors.warning.opacity(0.3), lineWidth: 2)
        )
    }

    // MARK: - Perks
    private var perksSection: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            Text("Premium Perks")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)

            perkRow(
                icon: "arrow.up.arrow.down.circle.fill",
                title: "Higher Transfer Limits",
                subtitle: viewModel.subscription?.isPremium == true
                    ? "$10,000/week transfer limit"
                    : "Upgrade from $5,000 to $10,000 weekly limit",
                color: DesignSystem.Colors.primary
            )

            perkRow(
                icon: "sunrise.fill",
                title: "Early Direct Deposit",
                subtitle: viewModel.subscription?.isPremium == true
                    ? "Access your pay up to 2 days early"
                    : "Get paid up to 2 days early",
                color: DesignSystem.Colors.warning
            )

            perkRow(
                icon: "chart.pie.fill",
                title: "Budgeting Tools",
                subtitle: "Spending insights, category tracking, and savings goals",
                color: DesignSystem.Colors.accent
            )

            perkRow(
                icon: "message.fill",
                title: "Priority Support",
                subtitle: "24/7 priority customer support with faster response times",
                color: DesignSystem.Colors.primaryDark
            )
        }
        .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.lg)
    }

    private func perkRow(icon: String, title: String, subtitle: String, color: Color) -> some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.1))
                    .frame(width: 44, height: 44)

                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                Text(subtitle)
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }

            Spacer()

            if viewModel.subscription?.isPremium == true {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(DesignSystem.Colors.accent)
            }
        }
    }
}

#Preview("Subscription View") {
    SubscriptionView()
}