# FluxPay iOS App

Send, receive, and manage money instantly from your iPhone.

## Requirements

- **Xcode 15.0+**
- **Swift 5.9+**
- **iOS 17.0+** deployment target
- **Swift Package Manager** (included with Xcode)

## Getting Started

### Open in Xcode

1. Clone or download this repository
2. Open Xcode
3. Select **File → Open** and choose `FluxPay/FluxPay.xcodeproj`
   - *If the `.xcodeproj` hasn't been generated yet, create it in Xcode:*
   - File → New → Project → iOS → App
   - Set Team, Bundle Identifier: `io.fluxpay.app`
   - Interface: **SwiftUI**, Language: **Swift**
   - Save into this directory, then copy all source files into the project

### Alternative: Create Project from Scratch

1. Create a new iOS App project in Xcode (SwiftUI, iOS 17+)
2. Replace the default `ContentView.swift` and `App.swift` with the files in this folder
3. Copy all files preserving the directory structure

## Project Structure

```
FluxPay/
├── Package.swift                      # Swift Package Manager manifest
├── FluxPay/
│   ├── Info.plist                     # App configuration
│   ├── FluxPayApp.swift               # @main app entry point
│   │
│   ├── Models/
│   │   ├── User.swift                 # User, Wallet, Transaction models
│   │   └── APIError.swift             # Error types (included in User.swift)
│   │
│   ├── Services/
│   │   └── APIClient.swift            # URLSession-based networking layer
│   │
│   ├── ViewModels/
│   │   ├── AuthViewModel.swift        # Auth state management
│   │   ├── HomeViewModel.swift        # Home screen data
│   │   ├── WalletViewModel.swift      # Wallet & payments logic
│   │   └── ActivityViewModel.swift    # Transaction history & filters
│   │
│   ├── Views/
│   │   ├── Onboarding/
│   │   │   ├── OnboardingView.swift    # Splash → auth flow entry
│   │   │   ├── PhoneEntryView.swift    # Phone/email input
│   │   │   └── VerificationCodeView.swift # 6-digit code input
│   │   │
│   │   ├── Main/
│   │   │   ├── MainTabView.swift       # 4-tab navigation
│   │   │   ├── Home/
│   │   │   │   └── HomeView.swift      # Balance + quick actions + recents
│   │   │   ├── Wallet/
│   │   │   │   ├── WalletView.swift    # Wallet details & limits
│   │   │   │   ├── SendMoneyView.swift # Send money form
│   │   │   │   └── RequestMoneyView.swift # Request money form
│   │   │   ├── Activity/
│   │   │   │   └── ActivityView.swift  # Transaction list with filters
│   │   │   └── Profile/
│   │   │       └── ProfileView.swift   # User profile & settings
│   │   │
│   │   └── Components/
│   │       └── Components.swift        # Reusable UI components
│   │
│   └── Utils/
│       ├── DesignSystem.swift          # Colors, typography, spacing
│       └── Constants.swift             # App constants & extensions
```

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | SwiftUI | Declarative views with `@State` + `@Environment` |
| **Navigation** | TabView + NavigationStack | 4-tab root nav, push/sheet for sub-screens |
| **State** | MVVM (ViewModel pattern) | `@Observable` macro on ViewModels, `@State` for view-owned state |
| **Networking** | URLSession + async/await | `APIClient.shared` singleton |
| **Design** | DesignSystem enum | Centralized colors, fonts, spacing tokens |

## Design System

FluxPay uses a clean white/blue palette inspired by modern fintech apps:

- **Primary**: `#1A73E8` (blue)
- **Accent**: `#34A853` (green)
- **Background**: White
- **Surface**: `#F8F9FA` (light gray)
- **Text**: `#1F2937` (near-black)
- **Typography**: System Rounded design

All design tokens are centralized in `Utils/DesignSystem.swift`.

## Networking

The `APIClient` is configured to point at `https://api.fluxpay.io/v1` (placeholder).
Update the `baseURL` in `Services/APIClient.swift` when the real backend URL is available.

### Authentication Flow
1. User enters phone → `POST /auth/request-code`
2. SMS code sent → `POST /auth/verify-code`
3. Token received → stored in `UserDefaults` (TODO: migrate to Keychain)

### Endpoints (Planned)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/request-code` | Request SMS verification code |
| POST | `/auth/verify-code` | Verify code & get auth token |
| GET | `/wallet` | Get wallet balance & details |
| GET | `/transactions` | List transactions (paginated) |
| POST | `/transactions/send` | Send money to user |
| POST | `/transactions/request` | Request money from user |
| GET | `/profile` | Get user profile |

## Next Steps

- [ ] Replace `UserDefaults` token storage with Keychain
- [ ] Wire up real backend endpoints
- [ ] Add Apple Pay integration
- [ ] Add biometric auth (Face ID)
- [ ] Implement push notifications
- [ ] Add unit tests + UI tests
- [ ] CI/CD pipeline setup
