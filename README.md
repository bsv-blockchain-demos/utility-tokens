# Utility Tokens Demo

A visual technical demo to illustrate BSV blockchain tokenization capabilities using overlay services.

## Overview

This demo illustrates the simplicity with which companies can create their own tokens on top of BSV Blockchain. It demonstrates the creation, transfer, and redemption of tokens with flexible properties that accommodate both fungible tokens and NFTs.

## Features

- **Token Creation**: Create custom tokens with flexible properties
- **Fungible Tokens**: Store credit example with amounts and balances
- **NFTs**: Event tickets (F1 Race) as unique non-fungible tokens
- **Token Transfer**: Send tokens to other users via identity-based addressing
- **Token Redemption**: Accept and manage received tokens
- **Overlay Service**: Validates transactions for minting and transfers
- **Wallet Management**: Track balances per token ID

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **BSV SDK**: @bsv/sdk for PushDrop tokens
- **Identity**: @bsv/identity-react for user discovery
- **Messaging**: @bsv/message-box-client for token transfers
- **Database**: MySQL (overlay service), MongoDB
- **Overlay**: Custom overlay service for token validation

## Quick Start with Docker

### Using Make (Easiest)

If you have `make` installed:

```bash
# Production mode
make prod

# Development mode with hot reload
make dev

# Stop services
make down

# View all available commands
make help
```

### Using Docker Compose Directly

**Production Mode**

Run the demo with a single command:

```bash
docker-compose up --build
```

Then open:
- **Tokenization Demo**: http://localhost:8082

Backend services:
- **Tokenization Overlay**: http://localhost:8083

Databases:
- **MySQL**: localhost:3306 (user: appuser, password: apppass, database: appdb)
- **MongoDB**: localhost:27017 (user: root, password: example)

To stop:
```bash
docker-compose down
```

**Development Mode (with Hot Reload)**

For development with automatic code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Changes to source code will automatically reload in the containers.

## Manual Setup

See [SPEC.md](./SPEC.md) for detailed technical specifications and implementation details.

## Requirements

**For Docker**:
- Docker
- Docker Compose

**For Manual Setup**:
- Node.js v18+
- npm or yarn
- MySQL
- MongoDB

## Token Types

### Fungible Tokens (Store Credits)
- **tokenID**: Identifier for the token type (UTF8 string)
- **amount**: Quantity of tokens (Uint64LE)
- Custom fields as needed

### NFTs (Event Tickets)
- **tokenID**: Unique identifier
- **metadata**: Event details, seat info, etc.
- Custom fields for ticket properties

## How It Works

1. **Create Tokens**: Define token properties and mint new tokens using PushDrop
2. **View Wallet**: Track all tokens by tokenID with current balances
3. **Send Tokens**: Select recipient via identity search, specify amount, and transfer
4. **Receive Tokens**: Accept incoming tokens via message box
5. **Overlay Validation**: All transactions validated by overlay service

For technical implementation details, see [SPEC.md](./SPEC.md).
