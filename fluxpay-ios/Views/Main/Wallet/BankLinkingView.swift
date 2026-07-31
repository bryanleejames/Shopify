import SwiftUI

// MARK: - Bank Linking View
/// Form to link a bank account to the FluxPay wallet.
struct BankLinkingView: View {
    @State private var accountHolderName = ""
    @State private var routingNumber = ""
    @State private var accountNumber = ""
    @State private var showSuccess = false
    @Bindable var viewModel: WalletViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Header
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        Image(systemName: "building.columns.circle.fill")
                            .font(.system(size: 64))
                            .foregroundColor(DesignSystem.Colors.primary)

                        Text("Link Your Bank")
                            .font(DesignSystem.Typography.title)
                            .foregroundColor(DesignSystem.Colors.textPrimary)

                        Text("Connect your bank account to transfer money out of FluxPay. Your information is encrypted and secure.")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, DesignSystem.Spacing.xl)

                    // Bank Details Form
                    VStack(spacing: DesignSystem.Spacing.md) {
                        FormField(
                            label: "Account Holder Name",
                            placeholder: "Full name on account",
                            text: $accountHolderName
                        )

                        FormField(
                            label: "Routing Number",
                            placeholder: "9-digit routing number",
                            text: $routingNumber,
                            keyboardType: .numberPad,
                            maxLength: 9
                        )

                        FormField(
                            label: "Account Number",
                            placeholder: "Account number",
                            text: $accountNumber,
                            keyboardType: .numberPad
                        )

                        // Info note
                        HStack(spacing: DesignSystem.Spacing.sm) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 14))
                                .foregroundColor(DesignSystem.Colors.textTertiary)

                            Text("Your bank details are stored securely with Stripe.")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }
                        .padding(.top, DesignSystem.Spacing.xs)
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(DesignSystem.Colors.surface)
                    .cornerRadius(DesignSystem.Radius.lg)

                    Spacer()

                    // Error message
                    if let error = viewModel.errorMessage, !viewModel.bankLinkSuccess {
                        Text(error)
                            .font(DesignSystem.Typography.footnote)
                            .foregroundColor(DesignSystem.Colors.error)
                            .multilineTextAlignment(.center)
                    }

                    // Action Buttons
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        FluxButton(
                            title: "Link Bank Account",
                            icon: Image(systemName: "link.badge.plus"),
                            isLoading: viewModel.isLinkingBank,
                            isDisabled: accountHolderName.isEmpty || routingNumber.count < 8 || accountNumber.isEmpty
                        ) {
                            await viewModel.linkBank(
                                accountHolderName: accountHolderName,
                                routingNumber: routingNumber,
                                accountNumber: accountNumber
                            )
                        }

                        FluxButton(
                            title: "Cancel",
                            style: .ghost,
                            action: { dismiss() }
                        )
                    }
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Link Bank")
            .navigationBarTitleDisplayMode(.inline)
        }
        .interactiveDismissDisabled(viewModel.isLinkingBank)
    }
}

// MARK: - Form Field
private struct FormField: View {
    let label: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var maxLength: Int? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
            Text(label)
                .font(DesignSystem.Typography.footnote)
                .foregroundColor(DesignSystem.Colors.textSecondary)

            TextField(placeholder, text: $text)
                .font(DesignSystem.Typography.body)
                .keyboardType(keyboardType)
                .textContentType(.none)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.background)
                .cornerRadius(DesignSystem.Radius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                        .stroke(DesignSystem.Colors.divider, lineWidth: 1)
                )
                .onChange(of: text) { _, newValue in
                    if let max = maxLength, newValue.count > max {
                        text = String(newValue.prefix(max))
                    }
                }
        }
    }
}

// MARK: - Preview
#Preview("Bank Linking") {
    BankLinkingView(viewModel: WalletViewModel())
}