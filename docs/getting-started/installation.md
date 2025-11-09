# Installation

## Prerequisites

- Node.js 18.x or higher
- An Appwrite project with database access
- TypeScript 5.0 or higher (recommended)

## Package Installation

Install the Appwrite ORM package along with the Appwrite SDK:

```bash
npm install appwrite-orm appwrite
```

Or using yarn:

```bash
yarn add appwrite-orm appwrite
```

Or using pnpm:

```bash
pnpm add appwrite-orm appwrite
```

## Development Dependencies

For TypeScript projects, you may also want to install type definitions:

```bash
npm install -D @types/node typescript
```

## Appwrite SDK Compatibility

The Appwrite ORM requires Appwrite SDK version 13.0.0 or higher. The package is designed to work with the latest Appwrite features and APIs.

### Supported Appwrite Versions

- ✅ Appwrite 13.x
- ✅ Appwrite 14.x
- ✅ Appwrite 15.x (latest)

## Environment Setup

### For Web Applications

No additional setup required. The web version works directly in browsers with the Appwrite Web SDK.

### For Server Applications

Ensure you have the necessary permissions and API keys:

1. Create an API key in your Appwrite console
2. Grant appropriate permissions (Database Read/Write)
3. Set up environment variables (recommended)

## Verification

Verify your installation by importing the package:

```typescript
import { WebORM, ServerORM } from 'appwrite-orm';
console.log('Appwrite ORM installed successfully!');
```

## Next Steps

- [Configuration](configuration.md) - Set up your Appwrite connection
- [Quick Start](quick-start.md) - Create your first ORM application