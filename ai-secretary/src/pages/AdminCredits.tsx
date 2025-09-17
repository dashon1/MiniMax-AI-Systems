import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: string
  credits_amount: number
  description: string
  balance_before: number
  balance_after: number
  created_at: string
}

interface User {
  user_id: string
  email: string
  full_name: string
}

export function AdminCredits() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [creditAmount, setCreditAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>('')
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [user?.id])

  async function loadInitialData() {
    try {
      const [usersResponse, analyticsResponse] = await Promise.all([
        supabase.functions.invoke('admin-user-management', {
          body: { action: 'list', adminUserId: user?.id }
        }),
        supabase.functions.invoke('admin-credit-management', {
          body: { action: 'analytics', adminUserId: user?.id }
        })
      ])

      if (usersResponse.data) setUsers(usersResponse.data.data || [])
      if (analyticsResponse.data) setAnalytics(analyticsResponse.data.data)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreditAllocation() {
    if (!selectedUser || creditAmount <= 0) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-credit-management', {
        body: {
          action: 'allocate',
          adminUserId: user?.id,
          userId: selectedUser,
          credits: creditAmount,
          description: description || 'Admin allocation'
        }
      })

      if (error) throw error
      
      // Reset form
      setSelectedUser('')
      setCreditAmount(0)
      setDescription('')
      
      // Reload data
      await loadInitialData()
      await loadUserHistory(selectedUser)
    } catch (error) {
      console.error('Failed to allocate credits:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCreditDeduction() {
    if (!selectedUser || creditAmount <= 0) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-credit-management', {
        body: {
          action: 'deduct',
          adminUserId: user?.id,
          userId: selectedUser,
          credits: creditAmount,
          description: description || 'Admin deduction'
        }
      })

      if (error) throw error
      
      // Reset form
      setSelectedUser('')
      setCreditAmount(0)
      setDescription('')
      
      // Reload data
      await loadInitialData()
      await loadUserHistory(selectedUser)
    } catch (error) {
      console.error('Failed to deduct credits:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function loadUserHistory(userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-credit-management', {
        body: {
          action: 'history',
          adminUserId: user?.id,
          userId: userId
        }
      })

      if (error) throw error
      setTransactions(data.data || [])
    } catch (error) {
      console.error('Failed to load user history:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
        <p className="mt-1 text-sm text-gray-600">Allocate and manage user credits</p>
      </div>

      {/* Credit Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Allocated</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalCreditsAllocated.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">-</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Used</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalCreditsUsed.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalTransactions.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Allocation Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Allocate Credits</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value)
                    if (e.target.value) loadUserHistory(e.target.value)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Amount</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter credit amount"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Transaction description"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreditAllocation}
                  disabled={!selectedUser || creditAmount <= 0 || actionLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Allocate Credits'}
                </button>
                <button
                  onClick={handleCreditDeduction}
                  disabled={!selectedUser || creditAmount <= 0 || actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Deduct Credits'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            {selectedUser && (
              <p className="text-sm text-gray-600">
                Showing transactions for: {users.find(u => u.user_id === selectedUser)?.full_name}
              </p>
            )}
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          transaction.transaction_type === 'credit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}{Math.abs(transaction.credits_amount)}
                        </span>
                        <span className="text-sm text-gray-600">{transaction.description}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Balance: {transaction.balance_after}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {selectedUser ? 'No transactions found' : 'Select a user to view transaction history'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics?.recentTransactions && (
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Platform Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {analytics.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.transaction_type === 'credit' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {transaction.transaction_type === 'credit' ? 'Allocated' : 'Deducted'} {Math.abs(transaction.credits_amount)} credits
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
