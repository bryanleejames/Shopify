import Foundation

// MARK: - Constants
enum Constants {
    static let appName = "FluxPay"
    static let appVersion = "1.0.0"

    // TODO: Replace with production URL
    static let apiBaseURL = "https://api.fluxpay.io/v1"

    // Feature flags
    static let enableBitcoin = false
    static let enableEarlyDirectDeposit = true
    static let enablePremiumSubscription = true

    // Limits
    static let maxTransferAmount: Decimal = 10_000
    static let defaultWeeklyLimit: Decimal = 500
    static let instantTransferFee: Decimal = 0.015 // 1.5%

    // UI
    static let animationDuration: Double = 0.3
    static let hapticFeedbackEnabled = true
}

// MARK: - Extensions
extension Decimal {
    /// Format as currency string (e.g., "$1,234.56")
    var currencyString: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: self as NSDecimalNumber) ?? "$0.00"
    }
}

extension Date {
    /// Relative date string ("Just now", "2m ago", "Yesterday", etc.)
    var relativeString: String {
        let now = Date()
        let diff = now.timeIntervalSince(self)

        switch diff {
        case ..<60:
            return "Just now"
        case ..<3600:
            return "\(Int(diff / 60))m ago"
        case ..<86400:
            return "\(Int(diff / 3600))h ago"
        case ..<172800:
            return "Yesterday"
        case ..<604800:
            return "\(Int(diff / 86400))d ago"
        default:
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            formatter.timeStyle = .none
            return formatter.string(from: self)
        }
    }
}
