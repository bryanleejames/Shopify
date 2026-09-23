# FluxPay — iOS App

SwiftUI app for FluxPay: send, receive, and manage money from your iPhone.

## Requirements

- Xcode 15.0+
- Swift 5.9+
- iOS 17.0+

## Setup

1. Open `FluxPay.xcodeproj` in Xcode
2. Set Team and Bundle Identifier (`io.fluxpay.app`)
3. Update `APIClient.baseURL` in `Services/APIClient.swift` to point at your backend (default: `http://localhost:3001`)
4. Build & run on iOS 17+ simulator

## Architecture

MVVM pattern using `@Observable` macro (iOS 17+):

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI with `@State` + `@Environment` |
| Navigation | TabView (Home, Wallet, Activity, Profile) + NavigationStack |
| State | 7 ViewModels via `@Observable` |
| Networking | URLSession async/await via `APIClient` singleton |
| Auth | JWT tokens stored in Keychain |
| Security | Face ID / Touch ID via `BiometricAuthService` |
| Design | Centralized `DesignSystem` enum |

## Project Structure

```
FluxPay/
├── FluxPayApp.swift              # @main entry + biometric lock overlay
├── Models/
│   └── User.swift                # User, Wallet, Transaction, Subscription, etc.
├── Services/
│   ├── APIClient.swift           # REST client (all 15+ endpoints)
│   ├── KeychainService.swift     # Secure token storage
│   └── BiometricAuthService.swift # Face ID / Touch ID
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── HomeViewModel.swift
│   ├── WalletViewModel.swift
│   ├── ActivityViewModel.swift
│   ├── ProfileViewModel.swift
│   ├── BiometricViewModel.swift
│   └── OnboardingViewModel.swift
├── Views/
│   ├── Main/
│   │   ├── MainTabView.swift
│   │   ├── Home/HomeView.swift
│   │   ├── Wallet/WalletView.swift, SendMoneyView, RequestMoneyView
│   │   ├── Wallet/BankLinkingView.swift, TransferToBankView.swift
│   │   ├── Activity/ActivityView.swift
│   │   └── Profile/ProfileView.swift, SubscriptionView.swift
│   ├── Onboarding/               # Auth flow
│   └── Components/               # Shared UI (FluxButton, etc.)
└── Utils/
    ├── DesignSystem.swift         # Colors, typography, spacing
    └── Constants.swift
```

## Key Features

- **JWT Auth**: email/password signup + login, phone verification
- **Wallet**: balance, weekly spend, bank accounts, subscription tier
- **Send/Request Money**: P2P transactions with pending accept/decline
- **Bank Transfers**: link bank account, instant (1.5% fee) or free standard
- **Premium**: $4.99/mo subscription via Stripe
- **Biometric Lock**: Face ID / Touch ID on app foreground, blurred overlay
- **Keychain Storage**: auth tokens in iOS Keychain with UserDefaults fallback

## Backend Connection

The app expects the backend at `http://localhost:3001`. Update `APIClient.baseURL` for production.
