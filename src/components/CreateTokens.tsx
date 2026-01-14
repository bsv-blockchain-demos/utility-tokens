'use client'

import { useState } from 'react'
import { WalletClient, PushDrop, Utils, Random, BigNumber, HTTPSOverlayBroadcastFacilitator, Transaction } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Coins, Hash, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'

const OVERLAY_URL = process.env.NEXT_PUBLIC_OVERLAY_URL as string
if (!OVERLAY_URL) throw new Error('NEXT_PUBLIC_OVERLAY_URL is not defined')

interface CreateTokensProps {
  wallet: WalletClient
}

interface CustomField {
  id: string
  name: string
  value: string
}

export function CreateTokens({ wallet }: CreateTokensProps) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: crypto.randomUUID(), name: '', value: '' }
    ])
  }

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id))
  }

  const updateCustomField = (id: string, key: 'name' | 'value', newValue: string) => {
    setCustomFields(customFields.map(field =>
      field.id === id ? { ...field, [key]: newValue } : field
    ))
  }

  const handleCreateTokens = async () => {
    if (!label.trim()) {
      toast.error('Token label required', {
        description: 'Please enter a label for your tokens',
        duration: 3000,
      })
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid amount greater than 0',
        duration: 3000,
      })
      return
    }

    setIsCreating(true)

    try {
      const token = new PushDrop(wallet)
      const protocolID: [0 | 1 | 2, string] = [2, 'tokendemo']
      const keyID = Utils.toBase64(Random(8))
      const counterparty = 'self'

      // Build the fields as byte arrays
      const fields: number[][] = []

      // Add tokenID field
      const tokenIdBytes = Utils.toArray('___mint___', 'utf8')
      fields.push(tokenIdBytes)

      // Add amount field as Uint64LE (8 bytes, little-endian)
      const w = new Utils.Writer()
      w.writeUInt64LEBn(new BigNumber(amount))
      const amountBytes = w.toArray()
      fields.push(amountBytes)

      customFields.unshift({ id: 'label', name: 'label', value: label });

      // Add custom fields as UTF-8 strings
      fields.push(Utils.toArray(JSON.stringify(customFields), 'utf8'))

      // Lock the tokens
      const lockingScript = await token.lock(
        fields,
        protocolID,
        keyID,
        counterparty,
        true, // forSelf
        false  // includeSignature
      )

      const response = await wallet.createAction({
        description: `Create ${amount} ${label} tokens`,
        outputs: [
          {
            satoshis: 1,
            lockingScript: lockingScript.toHex(),
            outputDescription: 'Token output',
            basket: 'demotokens3',
            customInstructions: JSON.stringify({ protocolID, keyID, counterparty }),
            tags: ['demotokens3', 'mint', label]
          }
        ],
        labels: ['demotokens3', 'mint'],
        options: {
          randomizeOutputs: false,
        }
      })

      if (!response?.txid) throw new Error('unable to issue those tokens')

      toast.success('Tokens created successfully!', {
        description: `Created ${Number(amount).toLocaleString()} ${label} tokens`,
        duration: 5000,
      })

      const overlay = new HTTPSOverlayBroadcastFacilitator(undefined, true)
      const tx = Transaction.fromBEEF(response.tx as number[])

      const taggedBEEF = {
        beef: tx.toBEEF(),
        topics: ['tm_tokendemo']
      }

      const overlayResponse = await overlay.send(OVERLAY_URL, taggedBEEF)

      if (overlayResponse['tm_tokendemo'].outputsToAdmit.length !== 1) throw new Error('overlay rejection')

      toast.success('Overlay validation passed', {
        description: 'Your tokens are now on the blockchain',
        duration: 5000,
      })

      // Reset form
      setLabel('')
      setAmount('')
      setCustomFields([])

    } catch (error) {
      console.error('Error creating tokens:', error)
      toast.error('Failed to create tokens', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm relative">
      {/* Loading Overlay */}
      {isCreating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin relative mx-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Creating Tokens...</h3>
              <p className="text-sm text-gray-600">Please wait while we mint your tokens on the blockchain</p>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-purple-500 to-blue-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl">Create Simple Tokens</CardTitle>
        </div>
        <CardDescription className="text-base">
          Create new fungible tokens by specifying a token label and amount.
          You can also add custom fields to define additional properties.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="label" required>
              Token Label
            </Label>
            <Input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Local Store Credits"
              icon={<Coins className="h-4 w-4" />}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" required>
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 10000"
              min="1"
              icon={<Hash className="h-4 w-4" />}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-5">
          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <Label className="text-base">Custom Fields</Label>
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-start animate-in fade-in duration-300">
                    <div className="flex-1 space-y-2">
                      <Input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                        placeholder="Field name"
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                        placeholder="Field value"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      onClick={() => removeCustomField(field.id)}
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={addCustomField}
            variant="outline"
            className="w-full border-dashed border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
            type="button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>

          <Button
          onClick={handleCreateTokens}
          disabled={isCreating}
          className="w-full h-12 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          type="button"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Tokens...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Tokens
            </>
          )}
          </Button>

          <div className="text-sm text-gray-600 space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="font-semibold text-blue-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Example:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 text-blue-800">
              <li>Token Label: "Local Store Credits"</li>
              <li>Amount: 10000</li>
              <li>Custom Field: issuer = "My Local Store"</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
