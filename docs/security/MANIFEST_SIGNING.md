# Manifest Signing Guide

This document explains how to set up and use the cryptographic signing system for AIOS-Core install manifests.

## Overview

AIOS-Core uses **Ed25519 digital signatures** (via minisign format) to verify the integrity and authenticity of the `install-manifest.yaml` file. This ensures that:

1. The manifest has not been tampered with after release
2. The manifest was created by an authorized maintainer
3. All file hashes in the manifest can be trusted

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNING WORKFLOW (Offline)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Maintainer's Secure Machine                                     │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ SECRET KEY       │───▶│ minisign -Sm install-manifest.yaml│  │
│  │ (aios-core.key)  │    │         -s aios-core.key          │  │
│  │ NEVER SHARE!     │    └───────────────────────────────────┘  │
│  └──────────────────┘                    │                       │
│                                          ▼                       │
│                          ┌───────────────────────────────────┐  │
│                          │ install-manifest.yaml.minisig     │  │
│                          │ (64-byte Ed25519 signature)       │  │
│                          └───────────────────────────────────┘  │
│                                          │                       │
└──────────────────────────────────────────│───────────────────────┘
                                           │
                                           ▼ Published to npm
┌─────────────────────────────────────────────────────────────────┐
│                  VERIFICATION WORKFLOW (npm install)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User's Machine (post-install)                                   │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ PINNED PUBLIC KEY│───▶│ post-install-validator.js         │  │
│  │ (hardcoded in    │    │   1. Load manifest + signature     │  │
│  │  source code)    │    │   2. Verify Ed25519 signature      │  │
│  └──────────────────┘    │   3. Parse manifest (if valid)     │  │
│                          │   4. Verify all file SHA256 hashes │  │
│                          └───────────────────────────────────┘  │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────────────┐  │
│                          │ ✓ Installation verified            │  │
│                          │   or                               │  │
│                          │ ✗ SECURITY WARNING                 │  │
│                          └───────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Initial Setup (One-Time)

### 1. Install minisign

```bash
# macOS
brew install minisign

# Ubuntu/Debian
apt install minisign

# Windows (via scoop)
scoop install minisign

# Or download from: https://jedisct1.github.io/minisign/
```

### 2. Generate Key Pair

```bash
# Generate a new Ed25519 key pair
minisign -G -p aios-core.pub -s aios-core.key

# You will be prompted for a password to protect the secret key
# CHOOSE A STRONG PASSWORD!

# Output:
#   aios-core.pub  - PUBLIC key (safe to share, will be hardcoded)
#   aios-core.key  - SECRET key (NEVER share, store securely)
```

### 3. View Public Key

```bash
cat aios-core.pub
# Output example:
# untrusted comment: minisign public key AIOS0001
# RWQf6LRCGA9i8VYn7sGv...base64...
```

### 4. Embed Public Key in Source Code

Edit `src/installer/manifest-signature.js`:

```javascript
const PINNED_PUBLIC_KEY = {
  // Key ID from the public key file comment
  keyId: 'AIOS0001',
  // Base64 public key (the second line of aios-core.pub)
  publicKey: 'RWQf6LRCGA9i8VYn7sGv...your-actual-key...',
  algorithm: 'Ed25519',
};
```

**IMPORTANT**: The public key MUST be hardcoded in the source code. Never load it from external files or environment variables - this is the root of trust.

### 5. Secure the Secret Key

- Store `aios-core.key` in a secure location (password manager, HSM, etc.)
- NEVER commit it to git
- Add to `.gitignore`:
  ```
  *.key
  aios-core.key
  ```
- Consider using a hardware security key for additional protection

## Release Workflow

### Before Each npm Publish

1. **Generate/Update Manifest**

   ```bash
   node bin/aios.js manifest:generate
   # Creates .aios-core/install-manifest.yaml with all file hashes
   ```

2. **Sign the Manifest**

   ```bash
   cd .aios-core
   minisign -Sm install-manifest.yaml -s /path/to/aios-core.key

   # Enter your password when prompted
   # Creates: install-manifest.yaml.minisig
   ```

3. **Verify Signature (Optional but Recommended)**

   ```bash
   minisign -Vm install-manifest.yaml -p /path/to/aios-core.pub
   # Should output: Signature and comment signature verified
   ```

4. **Commit Both Files**

   ```bash
   git add .aios-core/install-manifest.yaml
   git add .aios-core/install-manifest.yaml.minisig
   git commit -m "chore: update manifest and signature for vX.Y.Z"
   ```

5. **Publish to npm**
   ```bash
   npm publish
   ```

## Signature File Format

The `.minisig` file follows the minisign format:

```
untrusted comment: signature from minisign secret key
RUQf6LRCGA9i8...base64-encoded-signature-blob...
trusted comment: timestamp:1234567890 file:install-manifest.yaml
...base64-encoded-global-signature...
```

### Signature Blob Structure (74 bytes)

| Bytes | Content                      |
| ----- | ---------------------------- |
| 0-1   | Algorithm ("Ed" for Ed25519) |
| 2-9   | Key ID (8 bytes)             |
| 10-73 | Ed25519 signature (64 bytes) |

## Development Mode

During development and testing, signature verification can be bypassed:

```javascript
const validator = new PostInstallValidator(projectRoot, frameworkRoot, {
  requireSignature: false, // Skip signature check
  verifyHashes: true, // Still verify file hashes
});
```

**WARNING**: Never use `requireSignature: false` in production builds.

## Verification Behavior

| Mode                                    | Signature Missing | Invalid Signature | Valid Signature |
| --------------------------------------- | ----------------- | ----------------- | --------------- |
| Production (`requireSignature: true`)   | ERROR             | ERROR             | OK              |
| Development (`requireSignature: false`) | WARN              | ERROR             | OK              |

## Troubleshooting

### "Manifest signature file not found (.minisig)"

The signature file is missing. Run:

```bash
minisign -Sm .aios-core/install-manifest.yaml -s /path/to/aios-core.key
```

### "Key ID mismatch"

The manifest was signed with a different key than the one pinned in the code. Ensure you're using the correct key pair.

### "Signature verification failed"

The manifest content has been modified after signing. Regenerate and re-sign:

```bash
node bin/aios.js manifest:generate
minisign -Sm .aios-core/install-manifest.yaml -s /path/to/aios-core.key
```

### "Unsupported signature algorithm"

The signature file is not using Ed25519. Ensure you're using standard minisign (not a fork with different algorithms).

## Security Considerations

1. **Key Compromise**: If the secret key is compromised, generate a new key pair and release a new version with the updated public key. Users on older versions will need to update.

2. **Key Rotation**: Plan for periodic key rotation. Announce deprecation of old keys well in advance.

3. **CI/CD Signing**: For automated releases, consider:
   - Using a signing service
   - Storing the secret key in a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Using GitHub Actions encrypted secrets (with caution)

4. **Verification Bypass**: The `requireSignature: false` option should ONLY be used for local development. Production builds must always require signatures.

## API Reference

### `verifyManifestSignature(manifestContent, signatureContent, options)`

Verifies a manifest signature.

**Parameters:**

- `manifestContent` (Buffer): Raw manifest file content
- `signatureContent` (string): Content of .minisig file
- `options.publicKey` (Object): Override public key (testing only)

**Returns:**

```javascript
{
  valid: boolean,      // true if signature is valid
  error: string|null,  // error message if invalid
  keyId: string|null   // key ID used for signing
}
```

### `loadAndVerifyManifest(manifestPath, options)`

Loads and verifies a manifest file.

**Parameters:**

- `manifestPath` (string): Path to manifest file
- `options.requireSignature` (boolean): Fail if signature missing (default: true)

**Returns:**

```javascript
{
  content: Buffer|null,  // manifest content if valid
  verified: boolean,     // true if signature verified
  error: string|null     // error message if failed
}
```

## Changelog

- **v3.10.0**: Initial implementation of manifest signing
  - Ed25519 signatures via minisign format
  - Pinned public key in source code
  - Integration with post-install validator
