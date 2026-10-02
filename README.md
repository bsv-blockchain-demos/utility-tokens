# Utility Tokens

A React and TypeScript demo for issuing and transferring fungible PushDrop tokens through a BRC-100 wallet, an overlay service and a message box. It demonstrates token custody and recipient acceptance using the BSV SDK.

This repository contains the frontend. Overlay validation and message delivery are provided by external services; their server implementations are not included here.

## What the demo provides

- **Create Tokens:** choose a label, an amount and optional custom fields, then mint a token output.
- **Token Wallet:** inspect tokens held in the wallet's `demotokens3` basket.
- **Send Tokens:** select holdings, identify a recipient and create recipient and change outputs.
- **Receive Tokens:** list pending messages and import a payment into the wallet or dismiss its message.

Creation and transfer use real wallet transactions. Each token output carries one satoshi, separate from the token quantity recorded in its script. The connected wallet also supplies transaction fees.

## Run locally

Use Node.js 22 and npm, a running BRC-100 wallet and network access to the configured services. For a transfer demonstration, use two wallet identities with suitable message-box support.

```sh
git clone https://github.com/bsv-blockchain-demos/utility-tokens.git
cd utility-tokens
npm ci
npm run dev
```

Open `http://localhost:8080` and approve the wallet requests as needed. Initialising `WalletClient` does not itself establish that the wallet is authenticated or supports every operation the demo needs.

## Service configuration

| Service | Current setting |
| --- | --- |
| Overlay | `https://overlay-us-1.bsvb.tech`, hardcoded in the creation and sending components. |
| Overlay topic | `tm_tokendemo`. |
| Message box | `https://messagebox.babbage.systems`, configured in the wallet context with the `mainnet` preset. |
| Message queue | `demotokenpayments`. |
| Wallet basket | `demotokens3`. |

Although `.env.example` and the Docker build expose `VITE_OVERLAY_URL`, the current frontend does not read that variable. Changing it alone will not switch the overlay. Review the constants in [CreateTokens.tsx](src/components/CreateTokens.tsx), [SendTokens.tsx](src/components/SendTokens.tsx) and [WalletContext.tsx](src/context/WalletContext.tsx) when configuring a different environment.

## Try a transfer

1. In the first wallet, create a small integer quantity with a recognisable label.
2. Check the result in **Token Wallet** and confirm that overlay admission succeeded.
3. In **Send Tokens**, choose the token and recipient identity, then approve the transfer.
4. Switch to the recipient wallet and open **Receive Tokens**.
5. Accept the message to internalise output zero into the recipient's token basket. Refresh the wallet view to inspect the result.

The token identifier is based on the original mint outpoint. Subsequent outputs reference that identifier. Custom fields are included at minting, but the sending code currently carries forward only the label.

## Current limitations

- **Reject** acknowledges and removes the message. It does not reverse the transaction or return tokens to the sender.
- The wallet display uses the transaction ID for a fresh mint, while the transfer flow uses `txid.outputIndex`. This inconsistency can split the displayed balances for the same token.
- Balance loading reads at most 1,000 outputs and does not paginate further.
- Quantities are encoded as unsigned 64-bit values but are also converted to JavaScript numbers in the UI. Use small integer demo amounts; the interface does not enforce full integer-range correctness.
- Overlay admission and message delivery happen after wallet transaction creation. A later error does not imply that the wallet transaction was cancelled.
- The UI implements minting and transfers. Revocation and dedicated NFT workflows mentioned in [SPEC.md](SPEC.md) remain outside the implemented interface.

## Build and Docker

| Command | Purpose |
| --- | --- |
| `npm run build` | Type-check and build static assets in `dist/`. |
| `npm run preview` or `npm start` | Preview an existing build on port 8080. |
| `npm run lint` | Run ESLint. |
| `docker compose up --build -d` | Build and serve the frontend through Nginx on port 8080. |
| `docker compose -f docker-compose.dev.yml up --build` | Start the development container configuration. |

Docker runs only the frontend; the wallet, overlay and message-box prerequisites still apply. The `docker:*` npm scripts use the older `docker-compose` executable spelling. See [DOCKER.md](DOCKER.md) for the supplied container configuration, taking the unused overlay environment variable into account.

No automated test script is defined. Building the frontend does not verify a live token transfer or the external overlay's rules.

## Licence

**Documented licence: MIT.** This is the declaration recorded in the project documentation. No standalone licence file or package licence declaration is included in this repository.
