import Foundation
import SwiftUI

// MARK: - Auth ViewModel
@MainActor
@Observable
final class AuthViewModel {
    var isAuthenticated = false
    var isLoading = false
    var errorMessage: String?
    var isSignupMode = true

    // Form fields
    var email = ""
    var password = ""
    var fullName = ""
    var confirmPassword = ""

    var currentUser: User?

    private let apiClient = APIClient.shared

    /// Returns true if signup form is valid
    var isSignupFormValid: Bool {
        guard !email.isEmpty, !password.isEmpty, !fullName.isEmpty else { return false }
        guard email.contains("@") else { return false }
        guard password.count >= 6 else { return false }
        guard password == confirmPassword else { return false }
        return true
    }

    /// Returns true if login form is valid
    var isLoginFormValid: Bool {
        guard !email.isEmpty, !password.isEmpty else { return false }
        guard email.contains("@") else { return false }
        return true
    }

    // MARK: - Sign Up
    func signup() async {
        guard isSignupFormValid else {
            if password != confirmPassword {
                errorMessage = "Passwords do not match"
            } else if password.count < 6 {
                errorMessage = "Password must be at least 6 characters"
            } else {
                errorMessage = "Please fill in all fields"
            }
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let response = try await apiClient.signup(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password,
                fullName: fullName.trimmingCharacters(in: .whitespaces)
            )
            currentUser = response.user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Log In
    func login() async {
        guard isLoginFormValid else {
            errorMessage = "Please enter your email and password"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let response = try await apiClient.login(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password
            )
            currentUser = response.user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Toggle Mode
    func toggleMode() {
        withAnimation(.easeInOut(duration: 0.2)) {
            isSignupMode.toggle()
            errorMessage = nil
        }
    }

    // MARK: - Reset Form
    func resetForm() {
        email = ""
        password = ""
        fullName = ""
        confirmPassword = ""
        errorMessage = nil
    }

    // MARK: - Sign Out
    func signOut() {
        apiClient.clearAuthToken()
        isAuthenticated = false
        isSignupMode = true
        currentUser = nil
        resetForm()
    }
}
