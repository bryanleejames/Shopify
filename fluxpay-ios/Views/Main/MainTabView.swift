import SwiftUI

// MARK: - Main Tab View
/// Root navigation after onboarding.
/// Four tabs: Home, Wallet, Activity, Profile.
struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }

            WalletView()
                .tabItem {
                    Image(systemName: "wallet.pass.fill")
                    Text("Wallet")
                }

            ActivityView()
                .tabItem {
                    Image(systemName: "clock.arrow.circlepath")
                    Text("Activity")
                }

            ProfileView()
                .tabItem {
                    Image(systemName: "person.circle.fill")
                    Text("Profile")
                }
        }
        .tint(DesignSystem.Colors.primary)
        .onAppear {
            // Configure tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            appearance.backgroundColor = UIColor.white
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
