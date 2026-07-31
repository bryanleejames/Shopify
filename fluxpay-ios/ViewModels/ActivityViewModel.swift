import Foundation
import SwiftUI

@MainActor
@Observable
final class ActivityViewModel {
    var transactions: [TransactionResponse] = []
    var isLoading = false
    var isLoadingMore = false
    var errorMessage: String?
    var selectedFilter: TransactionFilter = .all
    var hasMore = true

    // Accept/Decline state
    var isProcessingId: String?

    private let apiClient = APIClient.shared
    private var currentOffset = 0
    private let pageSize = 20

    enum TransactionFilter: String, CaseIterable {
        case all = "All"
        case sent = "Sent"
        case received = "Received"
        case pending = "Pending"
    }

    var filteredTransactions: [TransactionResponse] {
        switch selectedFilter {
        case .all:
            return transactions
        case .sent:
            return transactions.filter { $0.type == "send" }
        case .received:
            return transactions.filter { $0.type == "receive" }
        case .pending:
            return transactions.filter { $0.status == "pending" }
        }
    }

    func loadTransactions() async {
        isLoading = true
        errorMessage = nil
        currentOffset = 0

        do {
            let result = try await apiClient.getTransactions(limit: pageSize, offset: 0)
            transactions = result.data
            hasMore = result.hasMore
            currentOffset = result.data.count
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func loadMoreTransactions() async {
        guard !isLoadingMore, hasMore else { return }
        isLoadingMore = true

        do {
            let result = try await apiClient.getTransactions(
                limit: pageSize,
                offset: currentOffset
            )
            transactions.append(contentsOf: result.data)
            hasMore = result.hasMore
            currentOffset += result.data.count
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoadingMore = false
    }

    // MARK: - Accept/Decline
    func acceptRequest(id: String) async {
        isProcessingId = id
        do {
            let _ = try await apiClient.acceptTransaction(id: id)
        } catch {
            errorMessage = error.localizedDescription
        }
        isProcessingId = nil
    }

    func declineRequest(id: String) async {
        isProcessingId = id
        do {
            let _ = try await apiClient.declineTransaction(id: id)
        } catch {
            errorMessage = error.localizedDescription
        }
        isProcessingId = nil
    }
}
