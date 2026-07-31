import SwiftUI

// MARK: - FluxPay Primary Button
struct FluxButton: View {
    let title: String
    let icon: Image?
    let isLoading: Bool
    let isDisabled: Bool
    let style: FluxButtonStyle
    let action: () -> Void

    enum FluxButtonStyle {
        case primary
        case secondary
        case ghost
        case danger
    }

    init(
        title: String,
        icon: Image? = nil,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        style: FluxButtonStyle = .primary,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.style = style
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: foregroundColor))
                } else if let icon = icon {
                    icon
                        .font(.system(size: 18, weight: .semibold))
                }

                Text(title)
                    .font(DesignSystem.Typography.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignSystem.Spacing.md)
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(DesignSystem.Radius.md)
            .overlay(
                style == .secondary || style == .ghost ?
                RoundedRectangle(cornerRadius: DesignSystem.Radius.md)
                    .stroke(borderColor, lineWidth: style == .ghost ? 0 : 1.5)
                : nil
            )
        }
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1.0)
    }

    private var backgroundColor: Color {
        switch style {
        case .primary:
            return DesignSystem.Colors.primary
        case .secondary:
            return .clear
        case .ghost:
            return .clear
        case .danger:
            return DesignSystem.Colors.error
        }
    }

    private var foregroundColor: Color {
        switch style {
        case .primary, .danger:
            return .white
        case .secondary:
            return DesignSystem.Colors.primary
        case .ghost:
            return DesignSystem.Colors.primary
        }
    }

    private var borderColor: Color {
        switch style {
        case .secondary:
            return DesignSystem.Colors.primary
        default:
            return .clear
        }
    }
}

// MARK: - Amount Input Field
struct AmountInputField: View {
    @Binding var amount: String
    let placeholder: String

    var body: some View {
        VStack(spacing: DesignSystem.Spacing.xs) {
            Text("$")
                .font(DesignSystem.Typography.balance)
                .foregroundColor(DesignSystem.Colors.textSecondary)
                .offset(y: -8)

            TextField(placeholder, text: $amount)
                .font(DesignSystem.Typography.balance)
                .multilineTextAlignment(.center)
                .keyboardType(.decimalPad)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .tint(DesignSystem.Colors.primary)
        }
        .padding(.vertical, DesignSystem.Spacing.lg)
    }
}

// MARK: - Balance Card
struct BalanceCard: View {
    let balance: Decimal
    let label: String

    var body: some View {
        VStack(spacing: DesignSystem.Spacing.xs) {
            Text(label)
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textSecondary)

            Text(balance.currencyString)
                .font(DesignSystem.Typography.balance)
                .foregroundColor(DesignSystem.Colors.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, DesignSystem.Spacing.xl)
        .padding(.horizontal, DesignSystem.Spacing.lg)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.xl)
        .shadow(color: DesignSystem.Colors.shadow, radius: 8, y: 4)
    }
}

// MARK: - Transaction Row
struct TransactionRow: View {
    let transaction: TransactionResponse

    var body: some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            // Icon
            ZStack {
                Circle()
                    .fill(iconBackground)
                    .frame(width: 44, height: 44)

                Image(systemName: iconName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(iconForeground)
            }

            // Details
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.counterpartyName ?? "Unknown")
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                if let desc = transaction.description, !desc.isEmpty {
                    Text(desc)
                        .font(DesignSystem.Typography.footnote)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .lineLimit(1)
                }

                Text(transaction.createdAt)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textTertiary)
            }

            Spacer()

            // Amount
            VStack(alignment: .trailing, spacing: 2) {
                Text(amountString)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(amountColor)

                if transaction.status == "pending" {
                    Text("Pending")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.warning)
                }
            }
        }
        .padding(.vertical, DesignSystem.Spacing.sm)
    }

    private var iconName: String {
        switch transaction.type {
        case "send":
            return "arrow.up.right"
        case "receive":
            return "arrow.down.left"
        case "request":
            return "doc.text"
        default:
            return "arrow.left.arrow.right"
        }
    }

    private var iconBackground: Color {
        switch transaction.type {
        case "send":
            return DesignSystem.Colors.error.opacity(0.1)
        case "receive":
            return DesignSystem.Colors.accent.opacity(0.1)
        case "request":
            return DesignSystem.Colors.warning.opacity(0.1)
        default:
            return DesignSystem.Colors.surface
        }
    }

    private var iconForeground: Color {
        switch transaction.type {
        case "send":
            return DesignSystem.Colors.error
        case "receive":
            return DesignSystem.Colors.accent
        case "request":
            return DesignSystem.Colors.warning
        default:
            return DesignSystem.Colors.textSecondary
        }
    }

    private var amountString: String {
        switch transaction.type {
        case "send", "request":
            return "-\(transaction.amount.currencyString)"
        case "receive":
            return "+\(transaction.amount.currencyString)"
        default:
            return transaction.amount.currencyString
        }
    }

    private var amountColor: Color {
        switch transaction.type {
        case "send", "request":
            return DesignSystem.Colors.error
        case "receive":
            return DesignSystem.Colors.accent
        default:
            return DesignSystem.Colors.textPrimary
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignSystem.Spacing.sm) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.1))
                        .frame(width: 56, height: 56)

                    Image(systemName: icon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(color)
                }

                Text(title)
                    .font(DesignSystem.Typography.footnote)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview
#Preview("FluxButton") {
    VStack(spacing: 16) {
        FluxButton(title: "Send Money", icon: Image(systemName: "paperplane.fill"), action: {})
        FluxButton(title: "Loading...", isLoading: true, action: {})
        FluxButton(title: "Secondary", style: .secondary, action: {})
        FluxButton(title: "Ghost", style: .ghost, action: {})
    }
    .padding()
}

#Preview("Transaction Row") {
    TransactionRow(
        transaction: TransactionResponse(
            id: "1",
            amount: 25.50,
            currency: "USD",
            type: "send",
            status: "completed",
            counterpartyName: "Alice Johnson",
            description: "Lunch split",
            note: nil,
            createdAt: "2026-07-05T12:00:00Z"
        )
    )
    .padding()
}

#Preview("Balance Card") {
    BalanceCard(balance: 1234.56, label: "Available Balance")
        .padding()
}

#Preview("Quick Actions") {
    HStack(spacing: 24) {
        QuickActionButton(icon: "paperplane.fill", title: "Send", color: DesignSystem.Colors.primary, action: {})
        QuickActionButton(icon: "arrow.down.doc.fill", title: "Request", color: DesignSystem.Colors.accent, action: {})
        QuickActionButton(icon: "plus.circle.fill", title: "Add", color: DesignSystem.Colors.warning, action: {})
    }
}
