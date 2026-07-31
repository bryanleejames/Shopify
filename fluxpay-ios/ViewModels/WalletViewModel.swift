import Foundation
import SwiftUI

@MainActor
@Observable
final class WalletViewModel {
    var balance: Decimal = 0.00
    var currency: String = "USD"
    var weeklyLimit: Decimal = 500.00
    var availableBalance: Decimal = 0.00
    var weeklySpent: Decimal = 0.00
    var linkedBank: String?
    var subscriptionTier: String?
    var earlyDirectDeposit: Bool = false
    var transferLimit: Decimal = 5000
    var bankAccounts: [WalletBankAccount] = []
    var isLoading = false
    var errorMessage: String?

    // Transfer state
    var transferAmount: Decimal = 0
    var transferFee: Decimal = 0
    var transferNetAmount: Decimal = 0
    var transferStatus: String?
    var transferEstimatedArrival: String?
    var transferBankName: String?
    var transferLastFour: String?
    var transferSuccess = false
    var isTransferring = false

    // Bank linking state
    var isLinkingBank = false
    var bankLinkSuccess = false

    // Bank accounts list
    var linkedBankAccounts: [BankAccount] = []
    var isLoadingBankAccounts = false

    private let apiClient = APIClient.shared

    func loadWallet() async {
        isLoading = true
        errorMessage = nil

        do {
            let wallet = try await apiClient.getWallet()
            balance = wallet.balance
            currency = wallet.currency
            weeklyLimit = wallet.weeklyLimit
            availableBalance = wallet.availableBalance
            weeklySpent = wallet.weeklySpent
            linkedBank = wallet.linkedBank
            subscriptionTier = wallet.subscriptionTier
            earlyDirectDeposit = wallet.earlyDirectDeposit ?? false
            transferLimit = wallet.transferLimit ?? wallet.weeklyLimit
            bankAccounts = wallet.bankAccounts ?? []
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func sendMoney(amount: Decimal, to recipientId: String, note: String?) async -> Bool {
        guard amount > 0 else {
            errorMessage = "Amount must be greater than $0"
            return false
        }
        guard !recipientId.isEmpty else {
            errorMessage = "Please select a recipient"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            let _ = try await apiClient.sendMoney(
                amount: amount,
                recipientId: recipientId,
                note: note
            )
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func requestMoney(amount: Decimal, from recipientId: String, note: String?) async -> Bool {
        guard amount > 0 else {
            errorMessage = "Amount must be greater than $0"
            return false
        }
        guard !recipientId.isEmpty else {
            errorMessage = "Please select a recipient"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            let _ = try await apiClient.requestMoney(
                amount: amount,
                recipientId: recipientId,
                note: note
            )
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func searchUsers(query: String) async -> [UserSearchResult] {
        guard query.count >= 2 else { return [] }
        do {
            let result = try await apiClient.searchUsers(query: query)
            return result.data
        } catch {
            return []
        }
    }

    // MARK: - Bank Linking
    func linkBank(accountHolderName: String, routingNumber: String, accountNumber: String) async -> Bool {
        guard !accountHolderName.isEmpty, !routingNumber.isEmpty, !accountNumber.isEmpty else {
            errorMessage = "Please fill in all fields"
            return false
        }

        isLinkingBank = true
        errorMessage = nil

        do {
            let _ = try await apiClient.linkBank(
                accountHolderName: accountHolderName,
                routingNumber: routingNumber,
                accountNumber: accountNumber
            )
            isLinkingBank = false
            bankLinkSuccess = true
            // Refresh wallet to get updated bank info
            await loadWallet()
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLinkingBank = false
            return false
        }
    }

    func loadBankAccounts() async {
        isLoadingBankAccounts = true
        do {
            let result = try await apiClient.getBankAccounts()
            linkedBankAccounts = result.data
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoadingBankAccounts = false
    }

    // MARK: - Transfer to Bank
    func transferToBank(amount: Decimal, bankAccountId: String, isInstant: Bool) async -> Bool {
        guard amount > 0 else {
            errorMessage = "Amount must be greater than $0"
            return false
        }

        isTransferring = true
        errorMessage = nil
        transferSuccess = false

        do {
            let response: TransferResponse
            if isInstant {
                response = try await apiClient.instantTransfer(amount: amount, bankAccountId: bankAccountId)
            } else {
                response = try await apiClient.standardTransfer(amount: amount, bankAccountId: bankAccountId)
            }

            transferAmount = response.amount
            transferFee = response.fee
            transferNetAmount = response.netAmount
            transferStatus = response.status
            transferEstimatedArrival = response.estimatedArrival ?? (isInstant ? "Within minutes" : "1-3 business days")
            transferBankName = response.bankAccount?.bankName
            transferLastFour = response.bankAccount?.lastFour
            transferSuccess = true
            isTransferring = false

            // Refresh wallet balance
            await loadWallet()
            return true
        } catch {
            errorMessage = error.localizedDescription
            isTransferring = false
            return false
        }
    }

    func resetTransferState() {
        transferAmount = 0
        transferFee = 0
        transferNetAmount = 0
        transferStatus = nil
        transferEstimatedArrival = nil
        transferBankName = nil
        transferLastFour = nil
        transferSuccess = false
    }

    func resetBankLinkState() {
        bankLinkSuccess = false
    }
}
