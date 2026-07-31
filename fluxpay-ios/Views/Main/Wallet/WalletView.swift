import SwiftUI

// MARK: - Wallet View
/// Shows wallet balance, linked bank accounts, and actions.
struct WalletView: View {
    @State private var viewModel = WalletViewModel()
    @State private var showSendMoney = false
    @State private var showRequestMoney = false
    @State private var showBankLinking = false
    @State private var showTransfer = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Balance Card
                    BalanceCard(
                        balance: viewModel.balance,
                        label: "Wallet Balance"
                    )

                    // Quick Actions
                    HStack(spacing: 24) {
                        QuickActionButton(
                            icon: "paperplane.fill",
                            title: "Send",
                            color: DesignSystem.Colors.primary,
                            action: { showSendMoney = true }
                        )

                        QuickActionButton(
                            icon: "arrow.down.doc.fill",
                            title: "Request",
                            color: DesignSystem.Colors.accent,
                            action: { showRequestMoney = true }
                        )

                        QuickActionButton(
                            icon: "creditcard.fill",
                            title: "Card",
                            color: DesignSystem.Colors.primaryDark,
                            action: {}
                        )

                        QuickActionButton(
                            icon: "building.columns.fill",
                            title: "Bank",
                            color: DesignSystem.Colors.warning,
                            action: { showBankLinking = true }
                        )
                    }

                    // Linked Bank Section
                    if let bank = viewModel.linkedBank {
                        linkedBankCard(bank)
                    }

                    // Transfer to Bank Button (only if bank linked)
                    if viewModel.linkedBank != nil || !viewModel.bankAccounts.isEmpty {
                        FluxButton(
                            title: "Transfer to Bank",
                            icon: Image(systemName: "arrow.right.doc.fill"),
                            style: .secondary,
                            action: { showTransfer = true }
                        )
                    }

                    // Wallet Details
                    VStack(spacing: DesignSystem.Spacing.md) {
                        walletDetailRow(
                            icon: "arrow.up.arrow.down",
                            title: "Weekly Limit",
                            value: viewModel.transferLimit.currencyString
                        )

                        Divider()

                        walletDetailRow(
                            icon: "checkmark.circle.fill",
                            title: "Available to Spend",
                            value: viewModel.availableBalance.currencyString,
                            valueColor: DesignSystem.Colors.accent
                        )

                        Divider()

                        walletDetailRow(
                            icon: "clock.arrow.circlepath",
                            title: "Spent This Week",
                            value: viewModel.weeklySpent.currencyString,
                            valueColor: DesignSystem.Colors.textPrimary
                        )

                        Divider()

                        // Subscription tier row
                        HStack {
                            Image(systemName: viewModel.subscriptionTier == "premium" ? "crown.fill" : "person.fill")
                                .font(.system(size: 18))
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                                .frame(width: 24)

                            Text("Plan")
                                .font(DesignSystem.Typography.subheadline)
                                .foregroundColor(DesignSystem.Colors.textSecondary)

                            Spacer()

                            HStack(spacing: 4) {
                                Text(viewModel.subscriptionTier == "premium" ? "Premium" : "Free")
                                    .font(DesignSystem.Typography.headline)
                                    .foregroundColor(viewModel.subscriptionTier == "premium"
                                        ? DesignSystem.Colors.warning
                                        : DesignSystem.Colors.textPrimary)

                                if viewModel.earlyDirectDeposit {
                                    Text("•")
                                        .foregroundColor(DesignSystem.Colors.textTertiary)
                                    Text("Early DD")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.accent)
                                }
                            }
                        }
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(DesignSystem.Colors.surface)
                    .cornerRadius(DesignSystem.Radius.lg)
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Wallet")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.loadWallet()
            }
            .task {
                await viewModel.loadWallet()
            }
            .sheet(isPresented: $showSendMoney) {
                SendMoneyView()
            }
            .sheet(isPresented: $showRequestMoney) {
                RequestMoneyView()
            }
            .sheet(isPresented: $showBankLinking) {
                BankLinkingView(viewModel: viewModel)
            }
            .sheet(isPresented: $showTransfer) {
                TransferToBankView(viewModel: viewModel)
            }
            .onChange(of: viewModel.bankLinkSuccess) { _, success in
                if success {
                    showBankLinking = false
                    viewModel.resetBankLinkState()
                }
            }
        }
    }

    private func linkedBankCard(_ bankInfo: String) -> some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            Image(systemName: "building.columns.fill")
                .font(.system(size: 20))
                .foregroundColor(DesignSystem.Colors.accent)
                .frame(width: 40, height: 40)
                .background(DesignSystem.Colors.accent.opacity(0.1))
                .cornerRadius(DesignSystem.Radius.md)

            VStack(alignment: .leading, spacing: 2) {
                Text("Linked Bank Account")
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textSecondary)

                Text(bankInfo)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }

            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 16))
                .foregroundColor(DesignSystem.Colors.accent)
        }
        .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.lg)
    }

    private func walletDetailRow(icon: String, title: String, value: String, valueColor: Color = DesignSystem.Colors.textPrimary) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(DesignSystem.Colors.textTertiary)
                .frame(width: 24)

            Text(title)
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textSecondary)

            Spacer()

            Text(value)
                .font(DesignSystem.Typography.headline)
                .foregroundColor(valueColor)
        }
    }
}