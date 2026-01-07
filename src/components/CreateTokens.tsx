import { useState } from 'react'
import { WalletClient, PushDrop, Utils, Random, BigNumber, HTTPSOverlayBroadcastFacilitator, Transaction } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { toast } from 'sonner'

const VITE_OVERLAY_URL = import.meta.env.VITE_OVERLAY_URL as string
if (!VITE_OVERLAY_URL) throw new Error('VITE_OVERLAY_URL is not defined')

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
      toast.error('Please enter a token label')
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
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

      toast.success(`Successfully created ${amount} ${label} tokens!`, {
        description: `Script created with ${fields.length} fields`
      })

      const overlay = new HTTPSOverlayBroadcastFacilitator(undefined, true)
      const tx = Transaction.fromBEEF(response.tx as number[])

      const taggedBEEF = {
        beef: tx.toBEEF(),
        topics: ['tm_tokendemo']
      }

      const overlayResponse = await overlay.send(VITE_OVERLAY_URL, taggedBEEF)

      if (overlayResponse['tm_tokendemo'].outputsToAdmit.length !== 1) throw new Error('overlay rejection')

      toast.success(`Accepted by overlay`, {
        description: `The tx passed Overlay Validation`
      })

      // Reset form
      setLabel('')
      setAmount('')
      setCustomFields([])

    } catch (error) {
      console.error('Error creating tokens:', error)
      toast.error('Failed to create tokens', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Simple Tokens</CardTitle>
        <CardDescription>
          Create new fungible tokens by specifying a token ID and amount.
          You can also add custom fields to define additional properties.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
              Token Label *
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Local Store Credits"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 10000"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Custom Fields</h3>
              {customFields.map((field) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                    placeholder="Field name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                    placeholder="Field value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button
                    onClick={() => removeCustomField(field.id)}
                    variant="outline"
                    className="px-3"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={addCustomField}
            variant="outline"
            className="w-full"
          >
            + Add Custom Field
          </Button>
        </div>

        <Button
          onClick={handleCreateTokens}
          disabled={isCreating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isCreating ? 'Creating...' : 'Create Tokens'}
        </Button>

        <div className="text-sm text-gray-500 space-y-1">
          <p><strong>Example:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Token ID: "Local Store Credits"</li>
            <li>Amount: 10000</li>
            <li>Custom Field: issuer = "My Local Store"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
