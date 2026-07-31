import SwiftUI

// MARK: - Send Money View
struct SendMoneyView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = WalletViewModel()

    @State private var amount = ""
    @State private var recipientText = ""
    @State private var note = ""
    @State private var isInstant = true
    @State private var showSuccess = false
    @State private var searchResults: [UserSearchResult] = []
    @State private var selectedRecipient: UserSearchResult?
    @State private var isSearching = false

    private var amountDecimal: Decimal? {
        let cleaned = amount.replacingOccurrences(of: ",", with: ".")
        return Decimal(string: cleaned)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.xl) {
                    if showSuccess {
                        successView
                    } else {
                        formContent
                    }
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if !showSuccess {
                        Button("Cancel") { dismiss() }
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
            }
            .interactiveDismissDisabled()
        }
    }

    // MARK: - Success View
    private var successView: some View {
        VStack(spacing: DesignSystem.Spacing.xl) {
            Spacer()
                .frame(height: 60)

            ZStack {
                Circle()
                    .fill(DesignSystem.Colors.accent.opacity(0.1))
                    .frame(width: 100, height: 100)

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(DesignSystem.Colors.accent)
            }

            Text("Money Sent! 🎉")
                .font(DesignSystem.Typography.title)
                .foregroundColor(DesignSystem.Colors.textPrimary)

            VStack(spacing: DesignSystem.Spacing.xs) {
                Text(amountDecimal?.currencyString ?? "$0.00")
                    .font(DesignSystem.Typography.balanceSmall)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                Text("to \(selectedRecipient?.displayName ?? recipientText)")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }

            Spacer()

            FluxButton(title: "Done", icon: Image(systemName: "checkmark")) {
                dismiss()
            }
        }
    }

    // MARK: - Form Content
    private var formContent: some View {
        VStack(spacing: DesignSystem.Spacing.xl) {
            // Header
            VStack(spacing: DesignSystem.Spacing.sm) {
                Text("Send Money")
                    .font(DesignSystem.Typography.title2)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                Text("Enter the amount to send")
                    .font(DesignSystem.Typography.subheadline)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }

            // Amount
            VStack(spacing: DesignSystem.Spacing.xs) {
                Text("$")
                    .font(DesignSystem.Typography.balance)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .offset(y: -8)

                TextField("0.00", text: $amount)
                    .font(DesignSystem.Typography.balance)
                    .multilineTextAlignment(.center)
                    .keyboardType(.decimalPad)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .tint(DesignSystem.Colors.primary)

                if let amount = amountDecimal, amount <= 0 {
                    Text("Amount must be greater than $0")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.error)
                }
            }
            .padding(.vertical, DesignSystem.Spacing.lg)

            // Recipient
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                Text("To")
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .textCase(.uppercase)

                HStack {
                    Image(systemName: selectedRecipient != nil ? "person.fill.checkmark" : "person.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(selectedRecipient != nil ? DesignSystem.Colors.accent : DesignSystem.Colors.textTertiary)

                    if let selected = selectedRecipient {
                        VStack(alignment: .leading, spacing: 0) {
                            Text(selected.displayName)
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            Text(selected.email)
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }

                        Spacer()

                        Button(action: {
                            selectedRecipient = nil
                            recipientText = ""
                            searchResults = []
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }
                    } else {
                        TextField("Search by email", text: $recipientText)
                            .font(DesignSystem.Typography.body)
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                            .tint(DesignSystem.Colors.primary)
                            .onChange(of: recipientText) { _, newValue in
                                Task {
                                    isSearching = true
                                    searchResults = await viewModel.searchUsers(query: newValue)
                                    isSearching = false
                                }
                            }

                        if isSearching {
                            ProgressView()
                        } else if !recipientText.isEmpty {
                            Button(action: { recipientText = "" }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(DesignSystem.Colors.textTertiary)
                            }
                        }
                    }
                }
                .padding()
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.md)

                // Search results
                if !searchResults.isEmpty, selectedRecipient == nil {
                    VStack(spacing: 0) {
                        ForEach(searchResults) { user in
                            Button(action: {
                                selectedRecipient = user
                                recipientText = user.email
                                searchResults = []
                            }) {
                                HStack {
                                    ZStack {
                                        Circle()
                                            .fill(DesignSystem.Colors.primaryLight)
                                            .frame(width: 36, height: 36)
                                        Text(String(user.displayName.prefix(1)).uppercased())
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundColor(DesignSystem.Colors.primary)
                                    }

                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(user.displayName)
                                            .font(DesignSystem.Typography.subheadline)
                                            .foregroundColor(DesignSystem.Colors.textPrimary)
                                        Text(user.email)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(DesignSystem.Colors.textTertiary)
                                }
                                .padding(.horizontal, DesignSystem.Spacing.md)
                                .padding(.vertical, DesignSystem.Spacing.sm)
                            }

                            if user.id != searchResults.last?.id {
                                Divider().padding(.leading, 52)
                            }
                        }
                    }
                    .background(DesignSystem.Colors.surface)
                    .cornerRadius(DesignSystem.Radius.md)
                }
            }

            // Note
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                Text("Note (optional)")
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .textCase(.uppercase)

                TextField("What's this for?", text: $note)
                    .font(DesignSystem.Typography.body)
                    .tint(DesignSystem.Colors.primary)
                    .padding()
                    .background(DesignSystem.Colors.surface)
                    .cornerRadius(DesignSystem.Radius.md)
            }

            // Transfer Speed
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Instant Transfer")
                        .font(DesignSystem.Typography.subheadline)
                        .foregroundColor(DesignSystem.Colors.textPrimary)

                    Text("1.5% fee • Arrives in seconds")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textTertiary)
                }

                Spacer()

                Toggle("", isOn: $isInstant)
                    .tint(DesignSystem.Colors.primary)
            }
            .padding()
            .background(DesignSystem.Colors.surface)
            .cornerRadius(DesignSystem.Radius.md)

            // Error
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.error)
                    .multilineTextAlignment(.center)
            }

            // Send Button — must select a recipient from search results
            let canSend = selectedRecipient != nil && (amountDecimal ?? 0) > 0
            FluxButton(
                title: "Send \(amountDecimal?.currencyString ?? "$0.00")",
                icon: Image(systemName: "paperplane.fill"),
                isLoading: viewModel.isLoading,
                isDisabled: !canSend
            ) {
                guard let recipient = selectedRecipient else { return }
                let success = await viewModel.sendMoney(
                    amount: amountDecimal ?? 0,
                    to: recipient.id,
                    note: note.isEmpty ? nil : note
                )
                if success {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        showSuccess = true
                    }
                }
            }
        }
    }
}
