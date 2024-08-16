# 快速开始

Start by installing the appropriate package for your framework.

```bash
npm install next-auth@beta
```

The only environment variable that is mandatory is the AUTH_SECRET. This is a random value used by the library to encrypt tokens and email verification hashes. (See Deployment to learn more). You can generate one via the official Auth.js CLI running:

```bash
npx auth secret
```
