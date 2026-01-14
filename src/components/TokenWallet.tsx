'use client'

import { useState, useEffect } from 'react'
import { WalletClient, PushDrop, LockingScript, Utils } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Wallet, RefreshCw, Coins } from 'lucide-react'

interface TokenWalletProps {
  wallet: WalletClient
}

export function TokenWallet({ wallet }: TokenWalletProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [balances, setBalances] = useState<Map<string, { amount: string, label: string }>>(new Map())

  useEffect(() => {
    loadBalances()
  }, [wallet])

  const loadBalances = async () => {
    setIsLoading(true)
    try {
      const simple = await wallet.listOutputs({
        basket: 'demotokens3',
        include: 'locking scripts',
        limit: 1000,
        offset: 0
      })

      const newBalances = new Map<string, { amount: string, label: string }>()

      simple.outputs.forEach(c => {
        const token = PushDrop.decode(LockingScript.fromHex(c.lockingScript as string))
        const r = new Utils.Reader(token.fields[1])
        const amount = String(r.readUInt64LEBn())
        const customFields = JSON.parse(Utils.toUTF8(token.fields[2]))
        const tkid = Utils.toUTF8(token.fields[0])
        const [txid, _] = c.outpoint.split('.')
        const tokenId = tkid === '___mint___' ? txid : tkid
        const details = {
          tokenId,
          amount,
          customFields
        }
        console.log({ details })
        const current = Number(newBalances.get(details.tokenId)?.amount) || 0
        newBalances.set(details.tokenId, { amount: String(current + Number(details.amount)), label: details?.customFields?.[0]?.value || 'Unknown' })
      })

      setBalances(newBalances)
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBalances = () => {
    loadBalances()
  }

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">My Token Wallet</CardTitle>
                <CardDescription className="text-base">
                  View your token balances and holdings
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={refreshBalances}
              variant="outline"
              className="w-full sm:w-auto"
              size="default"
              disabled
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh Balances</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <p className="text-gray-600">Loading your token balances...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">My Token Wallet</CardTitle>
              <CardDescription className="text-base">
                View your token balances and holdings
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={refreshBalances}
            variant="outline"
            className="w-full sm:w-auto"
            size="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh Balances</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {balances.size === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tokens yet</h3>
            <p className="text-gray-600">
              Create some tokens or receive tokens from others to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from(balances.entries()).map(([tokenId, amount]) => (
              <div
                key={tokenId}
                className="border border-gray-200 rounded-xl p-5 hover:bg-linear-to-br hover:from-purple-50 hover:to-blue-50 hover:border-purple-200 transition-all hover:shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Coins className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {amount.label}
                    </h3>
                    <p className="text-3xl font-bold text-transparent bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text mt-2">
                      {Number(amount.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                      {tokenId.slice(0, 8)}...{tokenId.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
