import Foundation
import SwiftUI

@MainActor
@Observable
final class HomeViewModel {
    var walletBalance: Decimal = 0.00
    var recentTransactions: [TransactionResponse] = []
    var pendingRequests: [TransactionResponse] = []
    var isLoading = false
    var errorMessage: String?

    // Accept/Decline state
    var isProcessingId: String? // ID of the request currently being processed
    var showDeclineConfirmation: TransactionResponse?
    var toastMessage: String?
    var showToast = false

    private let apiClient = APIClient.shared

    func loadHomeData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let wallet = apiClient.getWallet()
            async let txPage = apiClient.getTransactions(limit: 5)
            async let pendingPage = apiClient.getPendingTransactions()

            let (walletResult, txResult, pendingResult) = try await (wallet, txPage, pendingPage)
            walletBalance = walletResult.balance
            recentTransactions = txResult.data
            pendingRequests = pendingResult.data
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Accept/Decline
    func acceptRequest(id: String) async {
        isProcessingId = id
        errorMessage = nil

        do {
            let _ = try await apiClient.acceptTransaction(id: id)
            // Remove from pending list
            pendingRequests.removeAll { $0.id == id }
            toastMessage = "Request accepted!"
            showToast = true
            // Refresh data
            await loadHomeData()
        } catch {
            errorMessage = error.localizedDescription
            toastMessage = error.localizedDescription
            showToast = true
        }

        isProcessingId = nil
    }

    func declineRequest(id: String) async {
        isProcessingId = id
        errorMessage = nil

        do {
            let _ = try await apiClient.declineTransaction(id: id)
            pendingRequests.removeAll { $0.id == id }
            toastMessage = "Request declined"
            showToast = true
        } catch {
            errorMessage = error.localizedDescription
            toastMessage = error.localizedDescription
            showToast = true
        }

        isProcessingId = nil
    }

    func dismissToast() {
        showToast = false
        toastMessage = nil
    }
}
