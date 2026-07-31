import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let email: String
    let fullName: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, email
        case fullName = "full_name"
        case createdAt = "created_at"
    }
}

// MARK: - Auth Response
struct AuthResponse: Codable {
    let token: String
    let user: User
}

// MARK: - Wallet (from GET /wallet)
struct Wallet: Codable {
    let id: String
    let balance: Decimal
    let currency: String
    let linkedBank: String?
    let stripeAccountId: String?
    let weeklyLimit: Decimal
    let availableBalance: Decimal
    let weeklySpent: Decimal
    let subscriptionTier: String?
    let earlyDirectDeposit: Bool?
    let transferLimit: Decimal?
    let bankAccounts: [WalletBankAccount]?

    enum CodingKeys: String, CodingKey {
        case id, balance, currency
        case linkedBank = "linked_bank"
        case stripeAccountId = "stripe_account_id"
        case weeklyLimit = "weekly_limit"
        case availableBalance = "available_balance"
        case weeklySpent = "weekly_spent"
        case subscriptionTier = "subscription_tier"
        case earlyDirectDeposit = "early_direct_deposit"
        case transferLimit = "transfer_limit"
        case bankAccounts = "bank_accounts"
    }

    var isPremium: Bool {
        subscriptionTier == "premium"
    }

    var formattedTransferLimit: String {
        (transferLimit ?? weeklyLimit).currencyString
    }
}

// MARK: - Wallet Bank Account (summary inside GET /wallet)
struct WalletBankAccount: Codable {
    let id: String
    let bankName: String
    let lastFour: String
    let isDefault: Bool
    let status: String

    enum CodingKeys: String, CodingKey {
        case id
        case bankName = "bank_name"
        case lastFour = "last_four"
        case isDefault = "is_default"
        case status
    }
}

// MARK: - Bank Account (full from GET /wallet/bank-accounts)
struct BankAccount: Codable, Identifiable {
    let id: String
    let stripeBankAccountId: String?
    let bankName: String
    let lastFour: String
    let routingNumber: String?
    let accountHolderName: String
    let accountType: String
    let isDefault: Bool
    let status: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case stripeBankAccountId = "stripe_bank_account_id"
        case bankName = "bank_name"
        case lastFour = "last_four"
        case routingNumber = "routing_number"
        case accountHolderName = "account_holder_name"
        case accountType = "account_type"
        case isDefault = "is_default"
        case status
        case createdAt = "created_at"
    }

    var displayName: String {
        "\(bankName) (...\(lastFour))"
    }
}

// MARK: - Link Bank Response (from POST /wallet/link-bank)
struct LinkBankResponse: Codable {
    let id: String
    let bankName: String
    let lastFour: String
    let routingNumber: String?
    let accountHolderName: String
    let accountType: String
    let isDefault: Bool
    let status: String

    enum CodingKeys: String, CodingKey {
        case id
        case bankName = "bank_name"
        case lastFour = "last_four"
        case routingNumber = "routing_number"
        case accountHolderName = "account_holder_name"
        case accountType = "account_type"
        case isDefault = "is_default"
        case status
    }
}

// MARK: - Transfer Request Body
struct TransferRequestBody: Encodable {
    let amount: Decimal
    let bankAccountId: String

    enum CodingKeys: String, CodingKey {
        case amount
        case bankAccountId = "bank_account_id"
    }
}

// MARK: - Transfer Response (from POST /wallet/instant-transfer, /wallet/standard-transfer)
struct TransferResponse: Codable {
    let transferId: String?
    let id: String?
    let amount: Decimal
    let fee: Decimal
    let netAmount: Decimal
    let totalDeducted: Decimal?
    let status: String
    let estimatedArrival: String?
    let bankAccount: TransferBankAccount?
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case transferId = "transfer_id"
        case id
        case amount, fee
        case netAmount = "net_amount"
        case totalDeducted = "total_deducted"
        case status
        case estimatedArrival = "estimated_arrival"
        case bankAccount = "bank_account"
        case timestamp
    }
}

// MARK: - Transfer Bank Account
struct TransferBankAccount: Codable {
    let bankName: String
    let lastFour: String

    enum CodingKeys: String, CodingKey {
        case bankName = "bank_name"
        case lastFour = "last_four"
    }
}

// MARK: - Paginated Bank Accounts
struct PaginatedBankAccounts: Codable {
    let data: [BankAccount]
}

// MARK: - Subscription Response (from GET /subscription, POST /subscription/create, POST /subscription/cancel)
struct SubscriptionResponse: Codable {
    let tier: String
    let earlyDirectDeposit: Bool
    let transferLimit: Decimal
    let active: Bool
    let message: String?

    enum CodingKeys: String, CodingKey {
        case tier
        case earlyDirectDeposit = "early_direct_deposit"
        case transferLimit = "transfer_limit"
        case active, message
    }

    var isPremium: Bool {
        tier == "premium" && active
    }

    var formattedLimit: String {
        transferLimit.currencyString
    }
}

// MARK: - Profile Update Request Body
struct ProfileUpdateBody: Encodable {
    let displayName: String?

    enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
    }
}

// MARK: - Transaction Response (from GET /transactions)
struct TransactionResponse: Codable, Identifiable {
    let id: String
    let amount: Decimal
    let currency: String
    let type: String
    let status: String
    let counterpartyName: String?
    let description: String?
    let note: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, amount, currency, type, status
        case counterpartyName = "counterparty_name"
        case description, note
        case createdAt = "created_at"
    }
}

// MARK: - User Search Result
struct UserSearchResult: Codable, Identifiable {
    let id: String
    let email: String
    let displayName: String

    enum CodingKeys: String, CodingKey {
        case id, email
        case displayName = "display_name"
    }
}

// MARK: - Paginated Response Wrappers
struct PaginatedTransactions: Codable {
    let data: [TransactionResponse]
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool

    enum CodingKeys: String, CodingKey {
        case data, total, limit, offset
        case hasMore = "has_more"
    }
}

struct PaginatedUsers: Codable {
    let data: [UserSearchResult]
}

// MARK: - Send/Request Money Request
struct MoneyRequest: Encodable {
    let amount: Decimal
    let currency: String
    let recipientId: String
    let note: String?

    enum CodingKeys: String, CodingKey {
        case amount, currency, note
        case recipientId = "recipient_id"
    }
}

// MARK: - API Error
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingError
    case serverError(statusCode: Int, message: String)
    case networkError(Error)
    case unauthorized
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .decodingError:
            return "Failed to process server response"
        case .serverError(let code, let message):
            return message
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Session expired. Please sign in again."
        case .unknown:
            return "Something went wrong. Please try again."
        }
    }
}
