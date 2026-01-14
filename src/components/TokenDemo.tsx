'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { CreateTokens } from './CreateTokens'
import { TokenWallet } from './TokenWallet'
import { SendTokens } from './SendTokens'
import { ReceiveTokens } from './ReceiveTokens'
import { Card } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { useWallet } from '../context/WalletContext'
import { Wallet, Plus, Send, Download, AlertCircle, Loader2 } from 'lucide-react'

export function TokenDemo() {
  const { wallet, isInitialized, error } = useWallet()
  const [activeTab, setActiveTab] = useState('create')

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl border-0 animate-in fade-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin relative" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Initializing Wallet
              </h2>
              <p className="text-gray-600">Please wait while we connect to your BSV wallet.</p>
            </div>
            <div className="w-full space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4 mx-auto" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl border-0 animate-in fade-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-red-600">Wallet Error</h2>
              <p className="text-gray-700">{error}</p>
              <p className="text-gray-600 mt-4">
                Please install a compatible BSV wallet (e.g., Panda Wallet) and refresh the page.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Utility Token Creator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create, transfer, and manage tokens on the BSV blockchain with ease
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-100">
            <TabsTrigger
              value="create"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger
              value="send"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </TabsTrigger>
            <TabsTrigger
              value="receive"
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Receive</span>
            </TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in duration-500">
            <TabsContent value="create" className="mt-0">
              <CreateTokens wallet={wallet!} />
            </TabsContent>

            <TabsContent value="wallet" className="mt-0">
              <TokenWallet wallet={wallet!} />
            </TabsContent>

            <TabsContent value="send" className="mt-0">
              <SendTokens wallet={wallet!} />
            </TabsContent>

            <TabsContent value="receive" className="mt-0">
              <ReceiveTokens wallet={wallet!} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
