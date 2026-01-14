# BSV Token Demo - Frontend

A React + TypeScript frontend for creating, transferring, and managing tokens on the BSV blockchain using the PushDrop protocol.

## Features

- **Create Tokens**: Mint new fungible tokens with custom fields
- **Token Wallet**: View your token balances and holdings
- **Send Tokens**: Transfer tokens to other users
- **Receive Tokens**: Accept incoming token transfers

## Tech Stack

- **Next.js 16** - React framework with server-side rendering
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Modern utility-first styling
- **@bsv/sdk** - BSV blockchain SDK with PushDrop support
- **@bsv/identity-react** - Identity management and search
- **@bsv/message-box-client** - Peer-to-peer messaging
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+
- A BSV wallet browser extension (e.g., [Panda Wallet](https://github.com/Panda-Wallet/panda-wallet))

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory with the following:

```bash
NEXT_PUBLIC_OVERLAY_URL=https://overlay-us-1.bsvb.tech
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Docker

This project includes Docker support for both development and production environments.

### Quick Start with Docker

```bash
# Production mode
npm run docker:prod

# Development mode (with hot reload)
npm run docker:dev

# Stop services
npm run docker:down

# View logs
npm run docker:logs
```

For detailed Docker documentation, see [DOCKER.md](DOCKER.md)

## How It Works

### Token Creation

1. Navigate to the "Create Tokens" tab
2. Enter a Token ID (e.g., "Local Store Credits")
3. Specify the amount to mint
4. Optionally add custom fields (key-value pairs)
5. Click "Create Tokens"

The app uses the `PushDrop` class from `@bsv/sdk`:

```typescript
const token = new PushDrop(wallet)
const protocolID = [2, 'tokendemo']
const keyID = Utils.toBase64(Random(8))
const lockingScript = await token.lock(fields, protocolID, keyID, 'self', true, true)
```

### Token Transfers

1. Go to "Send Tokens" tab
2. Select the token ID and amount
3. Enter recipient's identity key
4. The transaction is sent to their message box
5. Recipient can accept in the "Receive Tokens" tab

### Wallet Integration

The app automatically connects to your BSV wallet via the `WalletClient` from `@bsv/sdk`. Make sure you have a compatible wallet installed.

## Architecture

```
app/
├── page.tsx                 # Home page (main entry)
├── layout.tsx               # Root layout with providers
└── globals.css              # Global styles

src/
├── components/
│   ├── TokenDemo.tsx        # Main app with tabs
│   ├── CreateTokens.tsx     # Token minting form
│   ├── TokenWallet.tsx      # Balance display
│   ├── SendTokens.tsx       # Transfer interface
│   ├── ReceiveTokens.tsx    # Accept incoming tokens
│   └── ui/                  # Reusable UI components
└── context/
    └── WalletContext.tsx    # Wallet state management
```

## Related Documentation

- [DOCKER.md](DOCKER.md) - Docker setup and deployment guide
- [SPEC.md](SPEC.md) - Full specification and technical details

## License

MIT
