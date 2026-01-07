import { useState, useEffect, useRef } from 'react'
import { Transaction, Beef, WalletClient, PushDrop, PublicKey, LockingScript, Random, BigNumber, Utils, HTTPSOverlayBroadcastFacilitator, type AtomicBEEF } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { useIdentitySearch } from '@bsv/identity-react'
import { useWallet } from '../context/WalletContext'

const VITE_OVERLAY_URL = import.meta.env.VITE_OVERLAY_URL as string
if (!VITE_OVERLAY_URL) throw new Error('VITE_OVERLAY_URL is not defined')

interface SendTokensProps {
  wallet: WalletClient
}

interface Utxo {
  tokenId: string
  amount: string
  outpoint: string
  customInstructions: string | undefined
  tx: Transaction
}

export function SendTokens({ wallet }: SendTokensProps) {
  const { messageBoxClient } = useWallet()
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [publicKeyInput, setPublicKeyInput] = useState('')
  const [balances, setBalances] = useState<Map<string, { amount: string, label: string }>>(new Map())
  const [isLoadingBalances, setIsLoadingBalances] = useState(true)
  const outputsRef = useRef<Map<string, Utxo[]>>(new Map())
  const beefRef = useRef<number[]>([])
  
  // Load balances on mount
  useEffect(() => {
    loadBalances()
  }, [wallet])

  const loadBalances = async () => {
    setIsLoadingBalances(true)
    try {
      const simple = await wallet.listOutputs({
        basket: 'demotokens3',
        include: 'entire transactions',
        limit: 1000,
        offset: 0,
        includeCustomInstructions: true
      })
      const newBalances = new Map<string, { amount: string, label: string }>()
      const newOutputs = new Map<string, Utxo[]>()

      const beef = new Beef()
      beef.mergeBeef(simple.BEEF as number[])

      simple.outputs.forEach(c => {
        const [txid, vout] = c.outpoint.split('.')
        const tx = beef.findAtomicTransaction(txid) as Transaction
        const lockingScript = tx.outputs[Number(vout)].lockingScript as LockingScript
        const token = PushDrop.decode(lockingScript)

        const r = new Utils.Reader(token.fields[1])
        const amount = String(r.readUInt64LEBn())
        const customFields = JSON.parse(Utils.toUTF8(token.fields[2]))
        const tkid = Utils.toUTF8(token.fields[0])
        const tokenId = tkid === '___mint___' ? c.outpoint : tkid
        const details = {
          tx,
          tokenId,
          amount,
          customFields,
          outpoint: c.outpoint,
          customInstructions: c.customInstructions
        }
        console.log({ details })
        const current = Number(newBalances.get(details.tokenId)?.amount) || 0
        newBalances.set(details.tokenId, { amount: String(current + Number(details.amount)), label: details?.customFields?.[0]?.value || 'Unknown' })

        const currentOut = outputsRef.current.get(details.tokenId) || []
        newOutputs.set(details.tokenId, [...currentOut, details])
      })

      

      outputsRef.current = newOutputs
      setBalances(newBalances)
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      setIsLoadingBalances(false)
    }
  }

  // Identity search hook
  const identitySearch = useIdentitySearch({
    originator: 'tokendemo',
    wallet,
    onIdentitySelected: (identity) => {
      if (identity) {
        setRecipient(identity.identityKey)
        setPublicKeyInput(identity.identityKey)
      }
    }
  })

  // Generate initials from identity info
  const getInitials = (name: string, identityKey: string): string => {
    if (!name || name.trim() === '') {
      return identityKey.slice(0, 2).toUpperCase()
    }

    const words = name.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    } else {
      return name.slice(0, 2).toUpperCase()
    }
  }

  const handleSendTokens = async () => {
    if (!tokenId.trim()) {
      toast.error('Please select a token')
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient balance
    const balanceInfo = balances.get(tokenId);
    const availableBalance = balanceInfo ? Number(balanceInfo.amount) : 0;
    const sendAmount = Number(amount)

    console.log({ tokenId, balanceInfo, availableBalance, sendAmount })

    if (availableBalance === 0) {
      toast.error(`You don't have any ${balanceInfo?.label || tokenId} tokens`)
      return
    }

    if (sendAmount > availableBalance) {
      toast.error(`Insufficient balance. You have ${availableBalance.toLocaleString()} ${balanceInfo?.label || tokenId}`, {
        description: `You're trying to send ${sendAmount.toLocaleString()}`
      })
      return
    }

    if (!recipient.trim()) {
      toast.error('Please enter a recipient identity')
      return
    }

    if (!messageBoxClient) {
      toast.error('Message box client not initialized')
      return
    }

    setIsSending(true)

    try {
      const token = new PushDrop(wallet)
      const protocolID: [0 | 1 | 2, string] = [2, 'tokendemo']
      const keyID = Utils.toBase64(Random(8))

      // Build the fields as byte arrays
      const fields: number[][] = []

      // Add tokenID field (use the actual tokenId, which is the outpoint for minted tokens)
      const tokenIdBytes = Utils.toArray(tokenId, 'utf8');
      fields.push(tokenIdBytes)

      // Add amount field as Uint64LE (8 bytes, little-endian)
      const w = new Utils.Writer()
      w.writeUInt64LEBn(new BigNumber(amount))
      const amountBytes = w.toArray()
      fields.push(amountBytes)

      // Add the label as a custom field
      fields.push(Utils.toArray(JSON.stringify([{ id: 'label', name: 'label', value: balanceInfo?.label || tokenId }]), 'utf8'))

      // Lock the tokens
      const lockingScript = await token.lock(
        fields,
        protocolID,
        keyID,
        publicKeyInput,
        false, // forSelf
        false  // includeSignature
      )

      let inAmountTotal = 0
      let numberOfInputsUsed = 0
      let customInstructions: string[] = []
      const beef = new Beef()
      const bytes = beefRef.current
      if (bytes.length > 0)
        beef.mergeBeef(bytes)
      const existingOutputs = outputsRef.current.get(tokenId) || []
      const inputs = existingOutputs.filter(o => {
        const amount = o.amount
        const useThis = inAmountTotal < sendAmount
        console.log({ useThis })
        if (useThis) {
          inAmountTotal += Number(amount)
          numberOfInputsUsed++
          customInstructions.push(o.customInstructions as string)
          beef.mergeBeef(o.tx.toBEEF())
        }
        return useThis
      }).map(o => ({
        inputDescription: 'Token input',
        outpoint: o.outpoint,
        unlockingScriptLength: 73
      }))

      const tokenChange = inAmountTotal - sendAmount
    // Build the fields as byte arrays
      const fieldsChange: number[][] = []

      // Add tokenID field (use the actual tokenId, which is the outpoint for minted tokens)
      fieldsChange.push(tokenIdBytes)

      // Add amount field as Uint64LE (8 bytes, little-endian)
      const w2 = new Utils.Writer()
      w2.writeUInt64LEBn(new BigNumber(tokenChange))
      const amountBytesChange = w2.toArray()
      fieldsChange.push(amountBytesChange)

      // Add the label as a custom field
      fieldsChange.push(Utils.toArray(JSON.stringify([{ id: 'label', name: 'label', value: balanceInfo?.label || tokenId }]), 'utf8'))
      const changeLockingScript = await token.lock(
        fieldsChange,
        protocolID,
        keyID,
        'self',
        true, // forSelf
        false  // includeSignature
      )

      if (inputs.length === 0) {
        toast.error('Insufficient balance of ' + (balanceInfo?.label || tokenId))
        return
      }

      console.log({inputs, numberOfInputsUsed })

      const response = await wallet.createAction({
        description: `Send ${amount} ${balanceInfo?.label || tokenId} tokens`,
        inputBEEF: beef.toBinary(),
        inputs,
        outputs: [
          {
            satoshis: 1,
            lockingScript: lockingScript.toHex(),
            outputDescription: 'Counterparty token output',
          },
          {
            satoshis: 1,
            lockingScript: changeLockingScript.toHex(),
            outputDescription: 'Token change output',
            basket: 'demotokens3',
            customInstructions: JSON.stringify({ protocolID, keyID, counterparty: 'self' }),
            tags: ['demotokens3', 'change', balanceInfo?.label || tokenId]
          }
        ],
        labels: ['demotokens3', 'transfer'],
        options: {
          randomizeOutputs: false,
        }
      })

      if (!response?.signableTransaction) throw new Error('unable to send those tokens')

      const reference = response.signableTransaction.reference 
      const txToSign = Transaction.fromBEEF(response.signableTransaction.tx)

      console.log({ numberOfInputsUsed, in: txToSign.inputs.map(i => i.unlockingScript?.toHex())})

      for (let i = 0; i < numberOfInputsUsed; i++) {
        const cu = JSON.parse(customInstructions[i])
        txToSign.inputs[i].unlockingScriptTemplate = new PushDrop(wallet).unlock(
          cu.protocolID,
          cu.keyID,
          cu.counterparty
        )
      }

      await txToSign.sign()

      const spends: Record<string, { unlockingScript: string }> = {}
      for (let i = 0; i < numberOfInputsUsed; i++) {
        const unlockingScript = txToSign.inputs[i].unlockingScript?.toHex()
        if (!unlockingScript) throw new Error(`Missing unlocking script for input ${i}`)
        spends[String(i)] = { unlockingScript }
      }

      const didItWork = await wallet.signAction({
        reference,
        spends
      })

      console.log({ didItWork })

      toast.success(`Tx Created`, {
        description: `${amount} ${balanceInfo?.label || tokenId} tokens in ${didItWork.txid}`
      })

      const overlay = new HTTPSOverlayBroadcastFacilitator(undefined, true)

      const taggedBEEF = {
        beef: didItWork.tx as AtomicBEEF,
        topics: ['tm_tokendemo']
      }

      const overlayResponse = await overlay.send(VITE_OVERLAY_URL, taggedBEEF)

      if (overlayResponse['tm_tokendemo'].outputsToAdmit.length === 0) throw new Error('overlay rejection')

      toast.success(`Accepted by overlay`, {
        description: `The tx passed Overlay Validation`
      })

      const { publicKey: sender } = await wallet.getPublicKey({ identityKey: true })

      // Send the token to recipient's message box
      await messageBoxClient.sendMessage({
        recipient,
        messageBox: 'demotokenpayments',
        body: {
          tokenId,
          amount: Number(amount),
          transaction: didItWork.tx as AtomicBEEF,
          keyID,
          protocolID,
          sender
        }
      })

      toast.success(`Successfully sent ${amount} ${balanceInfo?.label || tokenId} tokens!`, {
        description: `To: ${recipient.slice(0, 10)}...`
      })

      // Reload balances to reflect the sent tokens
      await loadBalances()

      // Reset form
      setTokenId('')
      setAmount('')
      setRecipient('')
      setPublicKeyInput('')
      // Clear identity search
      identitySearch.handleSelect(null as any, null)

    } catch (error) {
      console.error('Error sending tokens:', error)
      toast.error('Failed to send tokens', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Tokens</CardTitle>
        <CardDescription>
          Transfer tokens to another user by specifying their identity key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="sendTokenId" className="block text-sm font-medium text-gray-700 mb-1">
              Token ID *
            </label>
            {isLoadingBalances ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                Loading tokens...
              </div>
            ) : balances.size > 0 ? (
              <select
                id="sendTokenId"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a token</option>
                {Array.from(balances.entries()).map(([id, balance]) => (
                  <option key={id} value={id}>
                    {balance.label} ({Number(balance.amount).toLocaleString()} available)
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                No tokens available. Create or receive tokens first.
              </div>
            )}
            {tokenId && (
              <div className="mt-1">
                <p className="text-xs text-gray-600">
                  Available: <span className="font-semibold text-purple-600">
                    {Number(balances.get(tokenId)?.amount || 0).toLocaleString()}
                  </span> {balances.get(tokenId)?.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="sendAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <input
                id="sendAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 100"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 pr-16"
              />
              {tokenId && balances.get(tokenId) && (
                <button
                  type="button"
                  onClick={() => setAmount(balances.get(tokenId)?.amount || '0')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
              Search for Recipient
            </label>
            <div className="relative">
              <input
                id="recipient-search"
                type="text"
                value={identitySearch.inputValue}
                onChange={(e) => identitySearch.handleInputChange(e, e.target.value, 'input')}
                placeholder="Search by name, email, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!!publicKeyInput && !!recipient}
              />
              {identitySearch.isLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {identitySearch.inputValue && identitySearch.identities.length > 0 && !identitySearch.selectedIdentity && (
              <div className="mt-1 max-h-60 overflow-auto border border-gray-300 rounded-md bg-white shadow-lg">
                {identitySearch.identities.map((identity) => {
                  if (typeof identity === 'string') return null
                  return (
                    <div
                      key={identity.identityKey}
                      onClick={() => {
                        identitySearch.handleSelect(null as any, identity)
                        setRecipient(identity.identityKey)
                        setPublicKeyInput(identity.identityKey)
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {identity.avatarURL ? (
                        <img
                          src={identity.avatarURL}
                          alt={identity.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {getInitials(identity.name || '', identity.identityKey)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {identity.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {identity.identityKey.slice(0, 20)}...
                        </div>
                      </div>
                      {identity.badgeLabel && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {identity.badgeLabel}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {identitySearch.inputValue && identitySearch.identities.length === 0 && !identitySearch.isLoading && (
              <p className="text-xs text-gray-500 mt-1">
                No identities found
              </p>
            )}
          </div>

          <div>
            <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-1">
              {identitySearch.selectedIdentity ? 'Selected Recipient Identity Key' : 'Or Enter Recipient Public Key'}
            </label>
            <input
              id="publicKey"
              type="text"
              value={publicKeyInput}
              onChange={(e) => {
                const val = e.target.value.trim()
                setPublicKeyInput(val)
                if (val) {
                  try {
                    PublicKey.fromString(val)
                    setRecipient(val)
                    // Clear the search selection
                    identitySearch.handleSelect(null as any, null)
                  } catch (error) {
                    setRecipient('')
                  }
                } else {
                  setRecipient('')
                }
              }}
              disabled={!!identitySearch.selectedIdentity}
              placeholder="Enter public key directly"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                publicKeyInput && !recipient && !identitySearch.selectedIdentity
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              } ${identitySearch.selectedIdentity ? 'bg-gray-50' : ''}`}
            />
            {publicKeyInput && !recipient && !identitySearch.selectedIdentity && (
              <p className="text-xs text-red-600 mt-1">Invalid public key</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSendTokens}
          disabled={isSending}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSending ? 'Sending...' : 'Send Tokens'}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter the token ID and amount you want to send</li>
            <li>Provide the recipient's identity key</li>
            <li>The transaction will be sent to their message box</li>
            <li>They can accept the tokens in the "Receive Tokens" tab</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
