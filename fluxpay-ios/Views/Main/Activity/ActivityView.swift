import SwiftUI

// MARK: - Activity View
struct ActivityView: View {
    @State private var viewModel = ActivityViewModel()
    @State private var showDeclineConfirmation: TransactionResponse?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter Pills
                filterBar

                // Transaction List
                List {
                    if viewModel.isLoading && viewModel.transactions.isEmpty {
                        VStack(spacing: DesignSystem.Spacing.md) {
                            ProgressView()
                            Text("Loading transactions...")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, DesignSystem.Spacing.xxl)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    } else if viewModel.filteredTransactions.isEmpty {
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            Image(systemName: "tray")
                                .font(.system(size: 40))
                                .foregroundColor(DesignSystem.Colors.textTertiary)

                            Text("No transactions yet")
                                .font(DesignSystem.Typography.subheadline)
                                .foregroundColor(DesignSystem.Colors.textSecondary)

                            Text("Send or request money to get started")
                                .font(DesignSystem.Typography.footnote)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, DesignSystem.Spacing.xxl)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    } else {
                        ForEach(viewModel.filteredTransactions) { transaction in
                            VStack(spacing: 0) {
                                TransactionRow(transaction: transaction)

                                // Action buttons for incoming pending requests (type=request, status=pending)
                                if transaction.type == "request" && transaction.status == "pending" {
                                    pendingRequestActions(transaction)
                                } else if transaction.type == "receive" && transaction.status == "pending" {
                                    // Sent requests awaiting response from counterparty
                                    HStack {
                                        Spacer()
                                        Text("Awaiting response...")
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textTertiary)
                                            .padding(.top, 4)
                                        Spacer()
                                    }
                                }
                            }
                            .listRowSeparator(.visible, edges: .all)
                            .listRowInsets(EdgeInsets(
                                top: 4,
                                leading: DesignSystem.Spacing.lg,
                                bottom: 4,
                                trailing: DesignSystem.Spacing.lg
                            ))
                            .onAppear {
                                // Trigger load more when near the end
                                if transaction.id == viewModel.filteredTransactions.last?.id {
                                    Task {
                                        await viewModel.loadMoreTransactions()
                                    }
                                }
                            }
                        }

                        // Loading indicator for pagination
                        if viewModel.isLoadingMore {
                            HStack {
                                Spacer()
                                ProgressView()
                                    .padding()
                                Spacer()
                            }
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                        } else if viewModel.hasMore && !viewModel.filteredTransactions.isEmpty {
                            Text("Pull to load more")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .listRowSeparator(.hidden)
                                .listRowBackground(Color.clear)
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await viewModel.loadTransactions()
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Activity")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await viewModel.loadTransactions()
            }
            .confirmationDialog(
                "Decline Request?",
                isPresented: Binding(
                    get: { showDeclineConfirmation != nil },
                    set: { if !$0 { showDeclineConfirmation = nil } }
                ),
                presenting: showDeclineConfirmation
            ) { request in
                Button("Decline", role: .destructive) {
                    Task {
                        await viewModel.declineRequest(id: request.id)
                        await viewModel.loadTransactions()
                    }
                }
                Button("Cancel", role: .cancel) {
                    showDeclineConfirmation = nil
                }
            } message: { request in
                Text("This will decline the \(request.amount.currencyString) request from \(request.counterpartyName ?? "Unknown").")
            }
        }
    }

    // MARK: - Pending Request Actions
    @ViewBuilder
    private func pendingRequestActions(_ transaction: TransactionResponse) -> some View {
        HStack(spacing: DesignSystem.Spacing.sm) {
            Spacer()

            // Accept button
            Button(action: {
                Task {
                    await viewModel.acceptRequest(id: transaction.id)
                    await viewModel.loadTransactions()
                }
            }) {
                HStack(spacing: 4) {
                    if viewModel.isProcessingId == transaction.id {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.7)
                    } else {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                    }
                    Text("Accept")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.semibold)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.vertical, 6)
                .background(DesignSystem.Colors.accent)
                .foregroundColor(.white)
                .cornerRadius(DesignSystem.Radius.sm)
            }
            .disabled(viewModel.isProcessingId == transaction.id)

            // Decline button
            Button(action: {
                showDeclineConfirmation = transaction
            }) {
                HStack(spacing: 4) {
                    if viewModel.isProcessingId == transaction.id {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: DesignSystem.Colors.error))
                            .scaleEffect(0.7)
                    } else {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .bold))
                    }
                    Text("Decline")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.semibold)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.vertical, 6)
                .background(DesignSystem.Colors.error.opacity(0.1))
                .foregroundColor(DesignSystem.Colors.error)
                .cornerRadius(DesignSystem.Radius.sm)
            }
            .disabled(viewModel.isProcessingId == transaction.id)
        }
        .padding(.top, 4)
        .padding(.bottom, 6)
    }

    // MARK: - Filter Bar
    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                ForEach(ActivityViewModel.TransactionFilter.allCases, id: \.self) { filter in
                    filterPill(filter)
                }
            }
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .padding(.vertical, DesignSystem.Spacing.sm)
        }
        .background(DesignSystem.Colors.background)
    }

    private func filterPill(_ filter: ActivityViewModel.TransactionFilter) -> some View {
        Button(action: {
            withAnimation(.easeInOut(duration: 0.2)) {
                viewModel.selectedFilter = filter
            }
        }) {
            Text(filter.rawValue)
                .font(DesignSystem.Typography.subheadline)
                .fontWeight(viewModel.selectedFilter == filter ? .semibold : .regular)
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.vertical, DesignSystem.Spacing.sm)
                .background(
                    viewModel.selectedFilter == filter
                        ? DesignSystem.Colors.primary
                        : DesignSystem.Colors.surface
                )
                .foregroundColor(
                    viewModel.selectedFilter == filter
                        ? .white
                        : DesignSystem.Colors.textSecondary
                )
                .cornerRadius(DesignSystem.Radius.full)
        }
    }
}

#Preview("Activity View") {
    ActivityView()
}