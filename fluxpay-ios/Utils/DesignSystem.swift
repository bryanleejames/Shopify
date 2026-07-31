import SwiftUI

// MARK: - Design System
/// Centralized design tokens for FluxPay.
/// Clean, minimal palette inspired by modern fintech apps.
enum DesignSystem {
    // MARK: - Colors
    enum Colors {
        static let primary = Color(hex: "1A73E8")       // Bright blue
        static let primaryDark = Color(hex: "1557B0")    // Darker blue
        static let primaryLight = Color(hex: "E8F0FE")   // Light blue bg
        static let accent = Color(hex: "34A853")         // Green accent
        static let warning = Color(hex: "FBBC04")        // Yellow
        static let error = Color(hex: "EA4335")          // Red

        static let background = Color.white
        static let surface = Color(hex: "F8F9FA")        // Light gray bg
        static let surfaceElevated = Color.white

        static let textPrimary = Color(hex: "1F2937")    // Near black
        static let textSecondary = Color(hex: "6B7280")  // Gray
        static let textTertiary = Color(hex: "9CA3AF")   // Light gray
        static let textWhite = Color.white

        static let divider = Color(hex: "E5E7EB")
        static let shadow = Color.black.opacity(0.08)
    }

    // MARK: - Typography
    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold, design: .rounded)
        static let title = Font.system(size: 28, weight: .bold, design: .rounded)
        static let title2 = Font.system(size: 22, weight: .semibold, design: .rounded)
        static let headline = Font.system(size: 17, weight: .semibold, design: .rounded)
        static let body = Font.system(size: 17, weight: .regular, design: .rounded)
        static let callout = Font.system(size: 16, weight: .regular, design: .rounded)
        static let subheadline = Font.system(size: 15, weight: .regular, design: .rounded)
        static let footnote = Font.system(size: 13, weight: .regular, design: .rounded)
        static let caption = Font.system(size: 12, weight: .regular, design: .rounded)

        static let balance = Font.system(size: 48, weight: .bold, design: .rounded)
        static let balanceSmall = Font.system(size: 28, weight: .bold, design: .rounded)
    }

    // MARK: - Spacing
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    // MARK: - Corner Radius
    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let full: CGFloat = 9999
    }
}

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b, a: UInt64
        switch hex.count {
        case 6:
            (r, g, b, a) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (0, 0, 0, 255)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
