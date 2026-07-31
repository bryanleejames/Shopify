import Foundation
import SwiftUI

@MainActor
@Observable
final class ProfileViewModel {
    var subscription: SubscriptionResponse?
    var isLoadingSubscription = false
    var isUpgrading = false

    // Profile editing
    var isEditingName = false
    var editedDisplayName = ""
    var isSavingName = false
    var nameSaveSuccess = false
    var errorMessage: String?

    private let apiClient = APIClient.shared

    /// Load subscription status
    func loadSubscription() async {
        isLoadingSubscription = true
        do {
            subscription = try await apiClient.getSubscription()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoadingSubscription = false
    }

    /// Upgrade to premium
    func upgradeToPremium() async -> Bool {
        isUpgrading = true
        errorMessage = nil
        do {
            let result = try await apiClient.createSubscription()
            subscription = result
            isUpgrading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isUpgrading = false
            return false
        }
    }

    /// Cancel premium subscription
    func cancelSubscription() async -> Bool {
        isUpgrading = true
        errorMessage = nil
        do {
            let result = try await apiClient.cancelSubscription()
            subscription = result
            isUpgrading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isUpgrading = false
            return false
        }
    }

    /// Save display name
    func saveDisplayName() async -> User? {
        guard !editedDisplayName.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Name cannot be empty"
            return nil
        }

        isSavingName = true
        errorMessage = nil
        do {
            let updatedUser = try await apiClient.updateProfile(displayName: editedDisplayName.trimmingCharacters(in: .whitespaces))
            isSavingName = false
            nameSaveSuccess = true
            isEditingName = false
            return updatedUser
        } catch {
            errorMessage = error.localizedDescription
            isSavingName = false
            return nil
        }
    }
}