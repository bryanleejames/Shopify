import SwiftUI

// MARK: - Home View
/// Main landing screen showing balance, quick actions, pending requests, and recent activity.
struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @State private var showSendMoney = false
    @State private var showRequestMoney = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Header
                    headerSection

                    // Balance
                    BalanceCard(
                        balance: viewModel.walletBalance,
                        label: "Available Balance"
                    )

                    // Quick Actions
                    quickActionsSection

                    // Incoming Requests
                    if !viewModel.pendingRequests.isEmpty {
                        incomingRequestsSection
                    }

                    // Recent Activity
                    recentActivitySection
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationBarHidden(true)
            .refreshable {
                await viewModel.loadHomeData()
            }
            .task {
                await viewModel.loadHomeData()
            }
            .sheet(isPresented: $showSendMoney) {
                SendMoneyView()
            }
            .sheet(isPresented: $showRequestMoney) {
                RequestMoneyView()
            }
            // Decline confirmation dialog
            .confirmationDialog(
                "Decline Request?",
                isPresented: Binding(
                    get: { viewModel.showDeclineConfirmation != nil },
                    set: { if !$0 { viewModel.showDeclineConfirmation = nil } }
                ),
                presenting: viewModel.showDeclineConfirmation
            ) { request in
                Button("Decline", role: .destructive) {
                    Task {
                        await viewModel.declineRequest(id: request.id)
                    }
                }
                Button("Cancel", role: .cancel) {
                    viewModel.showDeclineConfirmation = nil
                }
            } message: { request in
                Text("This will decline the \(request.amount.currencyString) request from \(request.counterpartyName ?? "Unknown"). This action cannot be undone.")
            }
            // Toast overlay
            .overlay(alignment: .bottom) {
                if viewModel.showToast, let message = viewModel.toastMessage {
                    toastView(message)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: viewModel.showToast)
        }
    }

    // MARK: - Toast
    private func toastView(_ message: String) -> some View {
        HStack(spacing: DesignSystem.Spacing.sm) {
            Image(systemName: message.contains("accepted") ? "checkmark.circle.fill" :
                          message.contains("declined") ? "xmark.circle.fill" :
                          "exclamationmark.circle.fill")
                .foregroundColor(message.contains("accepted") ? DesignSystem.Colors.accent :
                                message.contains("declined") ? DesignSystem.Colors.textSecondary :
                                DesignSystem.Colors.error)

            Text(message)
                .font(DesignSystem.Typography.subheadline)
                .foregroundColor(DesignSystem.Colors.textPrimary)

            Spacer()

            Button(action: { viewModel.dismissToast() }) {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(DesignSystem.Colors.textTertiary)
            }
        }
        .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .cornerRadius(DesignSystem.Radius.lg)
        .shadow(color: DesignSystem.Colors.shadow, radius: 8, y: 4)
        .padding(.horizontal, DesignSystem.Spacing.lg)
        .padding(.bottom, DesignSystem.Spacing.xl)
        .transition(.move(edge: .bottom).combined(with: .opacity))
        .onTapGesture { viewModel.dismissToast() }
        .task {
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            viewModel.dismissToast()
        }
    }

    // MARK: - Header
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back,")
                    .font(DesignSystem.Typography.subheadline)
                    .foregroundColor(DesignSystem.Colors.textSecondary)

                Text("Alex 👋")
                    .font(DesignSystem.Typography.title2)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }

            Spacer()

            // Notification bell
            Button(action: {}) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell.fill")
                        .font(.system(size: 20))
                        .foregroundColor(DesignSystem.Colors.textSecondary)

                    if !viewModel.pendingRequests.isEmpty {
                        Circle()
                            .fill(DesignSystem.Colors.error)
                            .frame(width: 8, height: 8)
                            .offset(x: 2, y: -2)
                    }
                }
            }
        }
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        HStack(spacing: 24) {
            QuickActionButton(
                icon: "paperplane.fill",
                title: "Send",
                color: DesignSystem.Colors.primary,
                action: { showSendMoney = true }
            )

            QuickActionButton(
                icon: "arrow.down.doc.fill",
                title: "Request",
                color: DesignSystem.Colors.accent,
                action: { showRequestMoney = true }
            )

            QuickActionButton(
                icon: "plus.circle.fill",
                title: "Top Up",
                color: DesignSystem.Colors.warning,
                action: {}
            )

            QuickActionButton(
                icon: "banknote.fill",
                title: "Pay",
                color: DesignSystem.Colors.primaryDark,
                action: {}
            )
        }
        .padding(.vertical, DesignSystem.Spacing.sm)
    }

    // MARK: - Incoming Requests
    private var incomingRequestsSection: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            // Header with count
            HStack {
                Image(systemName: "envelope.badge.fill")
                    .font(.system(size: 16))
                    .foregroundColor(DesignSystem.Colors.warning)

                Text("You have \(viewModel.pendingRequests.count) pending \(viewModel.pendingRequests.count == 1 ? "request" : "requests")")
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)

                Spacer()
            }

            // Each pending request
            ForEach(viewModel.pendingRequests) { request in
                VStack(spacing: DesignSystem.Spacing.sm) {
                    HStack(spacing: DesignSystem.Spacing.md) {
                        // Avatar circle
                        ZStack {
                            Circle()
                                .fill(DesignSystem.Colors.warning.opacity(0.1))
                                .frame(width: 44, height: 44)

                            Image(systemName: "arrow.down.doc.fill")
                                .font(.system(size: 18))
                                .foregroundColor(DesignSystem.Colors.warning)
                        }

                        // Details
                        VStack(alignment: .leading, spacing: 2) {
                            Text(request.counterpartyName ?? "Unknown")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)

                            if let note = request.note, !note.isEmpty {
                                Text(note)
                                    .font(DesignSystem.Typography.footnote)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                    .lineLimit(1)
                            }

                            Text(formatDate(request.createdAt))
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }

                        Spacer()

                        // Amount
                        Text(request.amount.currencyString)
                            .font(DesignSystem.Typography.title3)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }

                    // Accept / Decline Buttons
                    HStack(spacing: DesignSystem.Spacing.sm) {
                        // Accept
                        Button(action: {
                            Task { await viewModel.acceptRequest(id: request.id) }
                        }) {
                            HStack(spacing: 6) {
                                if viewModel.isProcessingId == request.id {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                Text("Accept")
                                    .font(DesignSystem.Typography.subheadline)
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(DesignSystem.Colors.accent)
                            .foregroundColor(.white)
                            .cornerRadius(DesignSystem.Radius.md)
                        }
                        .disabled(viewModel.isProcessingId == request.id)

                        // Decline
                        Button(action: {
                            viewModel.showDeclineConfirmation = request
                        }) {
                            HStack(spacing: 6) {
                                if viewModel.isProcessingId == request.id {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: DesignSystem.Colors.error))
                                } else {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                Text("Decline")
                                    .font(DesignSystem.Typography.subheadline)
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(DesignSystem.Colors.error.opacity(0.1))
                            .foregroundColor(DesignSystem.Colors.error)
                            .cornerRadius(DesignSystem.Radius.md)
                        }
                        .disabled(viewModel.isProcessingId == request.id)
                    }
                }
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.lg)

                if request.id != viewModel.pendingRequests.last?.id {
                    Divider()
                        .foregroundColor(DesignSystem.Colors.divider)
                }
            }
        }
    }

    // MARK: - Recent Activity
    private var recentActivitySection: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            if !viewModel.recentTransactions.isEmpty {
                HStack {
                    Text("Recent Activity")
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.textPrimary)

                    Spacer()

                    NavigationLink(destination: ActivityView()) {
                        Text("See All")
                            .font(DesignSystem.Typography.footnote)
                            .foregroundColor(DesignSystem.Colors.primary)
                    }
                }

                VStack(spacing: 0) {
                    ForEach(viewModel.recentTransactions) { transaction in
                        TransactionRow(transaction: transaction)

                        if transaction.id != viewModel.recentTransactions.last?.id {
                            Divider()
                                .foregroundColor(DesignSystem.Colors.divider)
                        }
                    }
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.lg)
            } else if viewModel.isLoading {
                VStack(spacing: DesignSystem.Spacing.md) {
                    ProgressView()
                    Text("Loading activity...")
                        .font(DesignSystem.Typography.footnote)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, DesignSystem.Spacing.xl)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.lg)
            } else {
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 32))
                        .foregroundColor(DesignSystem.Colors.textTertiary)

                    Text("No recent activity")
                        .font(DesignSystem.Typography.subheadline)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, DesignSystem.Spacing.xl)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.Radius.lg)
            }
        }
    }

    // MARK: - Helpers
    private func formatDate(_ isoDate: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: isoDate) else {
            return isoDate
        }
        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .short
        return relative.localizedString(for: date, relativeTo: Date())
    }
}

#Preview("Home View") {
    NavigationStack {
        HomeView()
    }
}