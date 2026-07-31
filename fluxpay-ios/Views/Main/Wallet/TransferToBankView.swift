import SwiftUI

// MARK: - Transfer to Bank View
/// Transfer money from FluxPay wallet to a linked bank account.
/// Supports Instant (1.5% fee) and Standard (free, 1-3 business days) transfers.
struct TransferToBankView: View {
    @Bindable var viewModel: WalletViewModel
    @State private var amountText = ""
    @State private var isInstant = true
    @State private var selectedAccountId: String?
    @Environment(\.dismiss) private var dismiss

    private let instantFeeRate: Decimal = 0.015

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.transferSuccess {
                    transferSuccessView
                } else {
                    transferFormView
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Transfer to Bank")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !viewModel.transferSuccess {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                            .foregroundColor(DesignSystem.Colors.primary)
                    }
                }
            }
            .task {
                await viewModel.loadBankAccounts()
                if let first = viewModel.linkedBankAccounts.first {
                    selectedAccountId = first.id
                }
            }
        }
        .interactiveDismissDisabled(viewModel.isTransferring)
    }

    // MARK: - Transfer Form
    private var transferFormView: some View {
        ScrollView {
            VStack(spacing: DesignSystem.Spacing.lg) {
                // Amount Input
                VStack(spacing: DesignSystem.Spacing.xs) {
                    Text("Amount")
                        .font(DesignSystem.Typography.subheadline)
                        .foregroundColor(DesignSystem.Colors.textSecondary)

                    AmountInputField(amount: $amountText, placeholder: "0.00")
                }
                .padding(.top, DesignSystem.Spacing.xl)

                // Bank Account Picker
                if !viewModel.linkedBankAccounts.isEmpty {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("From")
                            .font(DesignSystem.Typography.subheadline)
                            .foregroundColor(DesignSystem.Colors.textSecondary)

                        ForEach(viewModel.linkedBankAccounts) { account in
                            Button(action: { selectedAccountId = account.id }) {
                                HStack(spacing: DesignSystem.Spacing.md) {
                                    Image(systemName: selectedAccountId == account.id
                                        ? "checkmark.circle.fill"
                                        : "circle")
                                        .foregroundColor(DesignSystem.Colors.primary)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(account.bankName)
                                            .font(DesignSystem.Typography.headline)
                                            .foregroundColor(DesignSystem.Colors.textPrimary)

                                        Text("...\(account.lastFour)")
                                            .font(DesignSystem.Typography.footnote)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }

                                    Spacer()

                                    if account.isDefault {
                                        Text("Default")
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.accent)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(DesignSystem.Colors.accent.opacity(0.1))
                                            .cornerRadius(DesignSystem.Radius.sm)
                                    }
                                }
                                .padding(DesignSystem.Spacing.md)
                                .background(DesignSystem.Colors.surface)
                                .cornerRadius(DesignSystem.Radius.md)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                } else if viewModel.isLoadingBankAccounts {
                    HStack {
                        Spacer()
                        ProgressView("Loading accounts...")
                        Spacer()
                    }
                } else {
                    HStack {
                        Spacer()
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 24))
                                .foregroundColor(DesignSystem.Colors.warning)

                            Text("No bank accounts linked")
                                .font(DesignSystem.Typography.body)
                                .foregroundColor(DesignSystem.Colors.textSecondary)

                            Text("Please link a bank account first in the Wallet tab.")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                                .multilineTextAlignment(.center)
                        }
                        Spacer()
                    }
                }

                // Transfer Speed Toggle
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Text("Transfer Speed")
                        .font(DesignSystem.Typography.subheadline)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    HStack(spacing: 0) {
                        speedToggleButton(
                            title: "Standard",
                            subtitle: "Free • 1-3 days",
                            isSelected: !isInstant,
                            action: { isInstant = false }
                        )

                        speedToggleButton(
                            title: "Instant",
                            subtitle: "1.5% fee • Minutes",
                            isSelected: isInstant,
                            action: { isInstant = true }
                        )
                    }
                    .clipShape(RoundedRectangle(cornerRadius: DesignSystem.Radius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                            .stroke(DesignSystem.Colors.divider, lineWidth: 1)
                    )
                }

                // Fee Breakdown (only for instant)
                if isInstant, let amount = amountDecimal, amount > 0 {
                    feeBreakdown(amount: amount)
                }

                // Error message
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(DesignSystem.Typography.footnote)
                        .foregroundColor(DesignSystem.Colors.error)
                        .multilineTextAlignment(.center)
                }

                Spacer(minLength: 20)

                // Transfer Button
                FluxButton(
                    title: isInstant
                        ? "Instant Transfer \(amountDecimal?.currencyString ?? "$0.00")"
                        : "Standard Transfer \(amountDecimal?.currencyString ?? "$0.00")",
                    icon: Image(systemName: "arrow.right.doc.fill"),
                    isLoading: viewModel.isTransferring,
                    isDisabled: !canTransfer
                ) {
                    await initiateTransfer()
                }
            }
            .padding(DesignSystem.Spacing.lg)
        }
    }

    // MARK: - Fee Breakdown
    private func feeBreakdown(amount: Decimal) -> some View {
        VStack(spacing: DesignSystem.Spacing.sm) {
            let fee = (amount * instantFeeRate).rounded(2, .bankers)
            let total = amount + fee

            Divider()

            feeRow(label: "Transfer Amount", value: amount.currencyString)
            feeRow(label: "Instant Fee (1.5%)", value: fee.currencyString, highlight: true)
            Divider()
            feeRow(label: "Total Deducted", value: total.currencyString, bold: true)
            feeRow(
                label: "You'll receive",
                value: (amount - fee).currencyString,
                valueColor: DesignSystem.Colors.accent
            )
        }
        .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.lg)
    }

    private func feeRow(label: String, value: String, highlight: Bool = false, bold: Bool = false, valueColor: Color? = nil) -> some View {
        HStack {
            Text(label)
                .font(DesignSystem.Typography.footnote)
                .foregroundColor(highlight ? DesignSystem.Colors.warning : DesignSystem.Colors.textSecondary)

            Spacer()

            Text(value)
                .font(bold ? DesignSystem.Typography.headline : DesignSystem.Typography.subheadline)
                .fontWeight(highlight ? .semibold : .regular)
                .foregroundColor(valueColor ?? (highlight ? DesignSystem.Colors.warning : DesignSystem.Colors.textPrimary))
        }
    }

    // MARK: - Speed Toggle Button
    private func speedToggleButton(title: String, subtitle: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Text(title)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(isSelected ? .white : DesignSystem.Colors.textPrimary)

                Text(subtitle)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(isSelected ? .white.opacity(0.85) : DesignSystem.Colors.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.surface)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Transfer Success View
    private var transferSuccessView: some View {
        ScrollView {
            VStack(spacing: DesignSystem.Spacing.xl) {
                Spacer()
                    .frame(height: 40)

                // Success Icon
                ZStack {
                    Circle()
                        .fill(DesignSystem.Colors.accent.opacity(0.1))
                        .frame(width: 100, height: 100)

                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(DesignSystem.Colors.accent)
                }

                Text("Transfer Initiated!")
                    .font(DesignSystem.Typography.title)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                // Transfer Details Card
                VStack(spacing: DesignSystem.Spacing.md) {
                    detailRow(label: "Amount", value: viewModel.transferAmount.currencyString)

                    if viewModel.transferFee > 0 {
                        detailRow(label: "Fee", value: "-\(viewModel.transferFee.currencyString)", valueColor: DesignSystem.Colors.warning)
                    }

                    Divider()

                    detailRow(
                        label: "Net Amount",
                        value: viewModel.transferNetAmount.currencyString,
                        valueColor: DesignSystem.Colors.accent,
                        bold: true
                    )

                    if let bankName = viewModel.transferBankName, let lastFour = viewModel.transferLastFour {
                        Divider()
                        detailRow(label: "To", value: "\(bankName) (...\(lastFour))")
                    }

                    if let arrival = viewModel.transferEstimatedArrival {
                        Divider()
                        detailRow(label: "Estimated Arrival", value: arrival)
                    }
                }
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.lg)

                Spacer()

                FluxButton(
                    title: "Done",
                    icon: Image(systemName: "checkmark"),
                    action: { dismiss() }
                )
            }
            .padding(DesignSystem.Spacing.lg)
        }
    }

    private func detailRow(label: String, value: String, valueColor: Color? = nil, bold: Bool = false) -> some View {
        HStack {
            Text(label)
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textSecondary)

            Spacer()

            Text(value)
                .font(bold ? DesignSystem.Typography.title3 : DesignSystem.Typography.headline)
                .fontWeight(bold ? .bold : .semibold)
                .foregroundColor(valueColor ?? DesignSystem.Colors.textPrimary)
        }
    }

    // MARK: - Actions
    private func initiateTransfer() async {
        guard let amount = amountDecimal,
              let accountId = selectedAccountId,
              amount > 0 else { return }

        let success = await viewModel.transferToBank(
            amount: amount,
            bankAccountId: accountId,
            isInstant: isInstant
        )

        if !success {
            // Error is set in viewModel.errorMessage, displayed above
        }
    }

    // MARK: - Computed Properties
    private var amountDecimal: Decimal? {
        guard !amountText.isEmpty else { return nil }
        return Decimal(string: amountText)
    }

    private var canTransfer: Bool {
        guard let amount = amountDecimal, amount > 0 else { return false }
        guard selectedAccountId != nil else { return false }
        guard !viewModel.linkedBankAccounts.isEmpty else { return false }
        return true
    }
}

// MARK: - Decimal Rounding Helper
extension Decimal {
    func rounded(_ scale: Int, _ roundingMode: NSDecimalNumber.RoundingMode) -> Decimal {
        var result = Decimal()
        var selfCopy = self
        NSDecimalRound(&result, &selfCopy, scale, roundingMode)
        return result
    }
}

// MARK: - Preview
#Preview("Transfer Form") {
    TransferToBankView(viewModel: WalletViewModel())
}