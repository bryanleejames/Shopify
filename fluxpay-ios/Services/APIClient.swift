import Foundation

// MARK: - API Client
final class APIClient {
    static let shared = APIClient()

    private let baseURL = "http://localhost:3001"

    private let session: URLSession
    private let jsonEncoder: JSONEncoder
    private let jsonDecoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        self.jsonEncoder = encoder

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        self.jsonDecoder = decoder
    }

    // MARK: - Auth Token
    private let keychain = KeychainService.shared

    private var authToken: String? {
        keychain.load(key: KeychainService.Keys.authToken)
    }

    func setAuthToken(_ token: String) {
        keychain.save(key: KeychainService.Keys.authToken, value: token)
    }

    func clearAuthToken() {
        keychain.delete(key: KeychainService.Keys.authToken)
    }

    // MARK: - Request Builder
    private func buildRequest(
        path: String,
        method: String = "GET",
        body: Encodable? = nil
    ) throws -> URLRequest {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try jsonEncoder.encode(AnyEncodable(body))
        }

        return request
    }

    // MARK: - Request Executor
    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response): (Data, URLResponse)

        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try jsonDecoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError
            }
        case 401:
            throw APIError.unauthorized
        default:
            if let errorBody = try? JSONDecoder().decode(ErrorBody.self, from: data) {
                throw APIError.serverError(statusCode: httpResponse.statusCode, message: errorBody.error)
            }
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(statusCode: httpResponse.statusCode, message: message)
        }
    }

    // MARK: - Auth
    func signup(email: String, password: String, fullName: String) async throws -> AuthResponse {
        let body = SignupRequestBody(email: email, password: password, fullName: fullName)
        let request = try buildRequest(path: "/auth/signup", method: "POST", body: body)
        let response: AuthResponse = try await perform(request)
        setAuthToken(response.token)
        return response
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        let body = LoginRequestBody(email: email, password: password)
        let request = try buildRequest(path: "/auth/login", method: "POST", body: body)
        let response: AuthResponse = try await perform(request)
        setAuthToken(response.token)
        return response
    }

    // MARK: - Profile
    func getProfile() async throws -> User {
        let request = try buildRequest(path: "/user/profile")
        return try await perform(request)
    }

    // MARK: - Wallet
    /// GET /wallet — full wallet details with real spending data
    func getWallet() async throws -> Wallet {
        let request = try buildRequest(path: "/wallet")
        return try await perform(request)
    }

    // MARK: - Transactions
    /// GET /transactions?limit=&offset= — returns paginated wrapper {data, total, has_more}
    func getTransactions(limit: Int = 20, offset: Int = 0) async throws -> PaginatedTransactions {
        let request = try buildRequest(path: "/transactions?limit=\(limit)&offset=\(offset)")
        return try await perform(request)
    }

    /// POST /transactions/send — send money by recipient user ID
    func sendMoney(amount: Decimal, recipientId: String, note: String?) async throws -> TransactionResponse {
        let body = MoneyRequest(amount: amount, currency: "USD", recipientId: recipientId, note: note)
        let request = try buildRequest(path: "/transactions/send", method: "POST", body: body)
        return try await perform(request)
    }

    /// POST /transactions/request — request money from another user
    func requestMoney(amount: Decimal, recipientId: String, note: String?) async throws -> TransactionResponse {
        let body = MoneyRequest(amount: amount, currency: "USD", recipientId: recipientId, note: note)
        let request = try buildRequest(path: "/transactions/request", method: "POST", body: body)
        return try await perform(request)
    }

    // MARK: - Bank Accounts
    /// POST /wallet/link-bank — link a bank account (mock mode works without real Stripe)
    func linkBank(accountHolderName: String, routingNumber: String, accountNumber: String) async throws -> LinkBankResponse {
        let body = LinkBankRequestBody(
            accountHolderName: accountHolderName,
            routingNumber: routingNumber,
            accountNumber: accountNumber
        )
        let request = try buildRequest(path: "/wallet/link-bank", method: "POST", body: body)
        return try await perform(request)
    }

    /// GET /wallet/bank-accounts — list linked bank accounts
    func getBankAccounts() async throws -> PaginatedBankAccounts {
        let request = try buildRequest(path: "/wallet/bank-accounts")
        return try await perform(request)
    }

    // MARK: - Transfers
    /// POST /wallet/instant-transfer — transfer to bank with 1.5% fee
    func instantTransfer(amount: Decimal, bankAccountId: String) async throws -> TransferResponse {
        let body = TransferRequestBody(amount: amount, bankAccountId: bankAccountId)
        let request = try buildRequest(path: "/wallet/instant-transfer", method: "POST", body: body)
        return try await perform(request)
    }

    /// POST /wallet/standard-transfer — free transfer (1-3 business days)
    func standardTransfer(amount: Decimal, bankAccountId: String) async throws -> TransferResponse {
        let body = TransferRequestBody(amount: amount, bankAccountId: bankAccountId)
        let request = try buildRequest(path: "/wallet/standard-transfer", method: "POST", body: body)
        return try await perform(request)
    }

    // MARK: - Accept/Decline Requests
    /// GET /transactions/pending — pending requests sent TO current user
    func getPendingTransactions() async throws -> PaginatedTransactions {
        let request = try buildRequest(path: "/transactions/pending")
        return try await perform(request)
    }

    /// POST /transactions/:id/accept — accept a pending money request
    func acceptTransaction(id: String) async throws -> TransactionResponse {
        let request = try buildRequest(path: "/transactions/\(id)/accept", method: "POST")
        return try await perform(request)
    }

    /// POST /transactions/:id/decline — decline a pending money request
    func declineTransaction(id: String) async throws -> TransactionResponse {
        let request = try buildRequest(path: "/transactions/\(id)/decline", method: "POST")
        return try await perform(request)
    }

    // MARK: - Subscriptions
    /// GET /subscription — current user's subscription status
    func getSubscription() async throws -> SubscriptionResponse {
        let request = try buildRequest(path: "/subscription")
        return try await perform(request)
    }

    /// POST /subscription/create — upgrade to premium
    func createSubscription() async throws -> SubscriptionResponse {
        let request = try buildRequest(path: "/subscription/create", method: "POST")
        return try await perform(request)
    }

    /// POST /subscription/cancel — cancel/revert to free
    func cancelSubscription() async throws -> SubscriptionResponse {
        let request = try buildRequest(path: "/subscription/cancel", method: "POST")
        return try await perform(request)
    }

    // MARK: - Profile
    /// PUT /profile — update display_name, avatar_url, etc.
    func updateProfile(displayName: String?) async throws -> User {
        let body = ProfileUpdateBody(displayName: displayName)
        let request = try buildRequest(path: "/profile", method: "PUT", body: body)
        return try await perform(request)
    }

    // MARK: - User Search
    /// GET /users/search?q= — returns paginated wrapper {data: [...]}
    func searchUsers(query: String) async throws -> PaginatedUsers {
        guard let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            return PaginatedUsers(data: [])
        }
        let request = try buildRequest(path: "/users/search?q=\(encoded)")
        return try await perform(request)
    }

    // MARK: - Push Notifications
    /// POST /notifications/register — register this device's APNs/FCM token.
    /// Idempotent on the server: re-registering the same token returns 200.
    func registerDeviceToken(_ token: String, platform: String = "ios") async throws -> NotificationRegistrationResponse {
        let body = NotificationRegisterBody(token: token, platform: platform)
        let request = try buildRequest(path: "/notifications/register", method: "POST", body: body)
        return try await perform(request)
    }

    /// POST /notifications/unregister — remove this device token (logout / opt-out).
    func unregisterDeviceToken(_ token: String) async throws -> NotificationUnregisterResponse {
        let body = NotificationUnregisterBody(token: token)
        let request = try buildRequest(path: "/notifications/unregister", method: "POST", body: body)
        return try await perform(request)
    }
}

// MARK: - Request Body Types
private struct SignupRequestBody: Encodable {
    let email: String
    let password: String
    let fullName: String
    enum CodingKeys: String, CodingKey {
        case email, password
        case fullName = "full_name"
    }
}

private struct LoginRequestBody: Encodable {
    let email: String
    let password: String
}

private struct LinkBankRequestBody: Encodable {
    let accountHolderName: String
    let routingNumber: String
    let accountNumber: String

    enum CodingKeys: String, CodingKey {
        case accountHolderName = "account_holder_name"
        case routingNumber = "routing_number"
        case accountNumber = "account_number"
    }
}

private struct NotificationRegisterBody: Encodable {
    let token: String
    let platform: String
}

private struct NotificationUnregisterBody: Encodable {
    let token: String
}

private struct ErrorBody: Decodable {
    let error: String
}

// MARK: - Type Erasure Helper
private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) {
        self.value = value
    }
    func encode(to encoder: Encoder) throws {
        try value.encode(to: encoder)
    }
}
