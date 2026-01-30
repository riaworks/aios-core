/**
 * Manifest Signature Verification
 * Implements minisign-compatible signature verification for install manifests
 *
 * @module src/installer/manifest-signature
 * @story 6.19 - Post-Installation Validation & Integrity Verification
 * @security CRITICAL - This module establishes the root of trust
 *
 * Signing workflow (offline, by maintainers):
 *   minisign -Sm install-manifest.yaml -s /path/to/secret.key
 *
 * This creates install-manifest.yaml.minisig
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');

/**
 * PINNED PUBLIC KEY - MUST BE HARDCODED
 * This is the root of trust for manifest verification.
 * Generated with: minisign -G -p aios-core.pub -s aios-core.key
 *
 * Format: base64-encoded Ed25519 public key
 * DO NOT load this from external files or environment variables.
 */
const PINNED_PUBLIC_KEY = {
  // Key ID (first 8 bytes of key, used for key identification)
  keyId: 'AIOS0001',
  // Ed25519 public key (32 bytes, base64 encoded)
  // TODO: Replace with actual generated public key before production
  publicKey: 'REPLACE_WITH_ACTUAL_PUBLIC_KEY_BASE64_HERE',
  // Algorithm identifier
  algorithm: 'Ed25519',
};

/**
 * Signature verification result
 * @typedef {Object} VerificationResult
 * @property {boolean} valid - True if signature is valid
 * @property {string|null} error - Error message if invalid
 * @property {string|null} keyId - Key ID used for signing
 */

/**
 * Parse a minisign signature file
 * Minisign signature format:
 *   Line 1: untrusted comment
 *   Line 2: base64-encoded signature
 *   Line 3 (optional): trusted comment
 *   Line 4 (optional): base64-encoded global signature
 *
 * @param {string} signatureContent - Content of .minisig file
 * @returns {Object} Parsed signature components
 */
function parseMinisignSignature(signatureContent) {
  const lines = signatureContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('Invalid signature format: insufficient lines');
  }

  // Line 1: untrusted comment (starts with "untrusted comment: ")
  if (!lines[0].startsWith('untrusted comment:')) {
    throw new Error('Invalid signature format: missing untrusted comment');
  }

  // Line 2: base64 signature blob
  const signatureBlob = Buffer.from(lines[1].trim(), 'base64');

  if (signatureBlob.length < 74) {
    throw new Error('Invalid signature format: signature too short');
  }

  // Parse signature blob structure:
  // bytes 0-1: algorithm (Ed = 0x45 0x64)
  // bytes 2-9: key ID (8 bytes)
  // bytes 10-73: signature (64 bytes)
  const algorithm = signatureBlob.slice(0, 2).toString('ascii');
  const keyId = signatureBlob.slice(2, 10);
  const signature = signatureBlob.slice(10, 74);

  // Optional: trusted comment and global signature
  let trustedComment = null;
  let globalSignature = null;

  if (lines.length >= 4) {
    if (lines[2].startsWith('trusted comment:')) {
      trustedComment = lines[2].substring('trusted comment:'.length).trim();
      globalSignature = Buffer.from(lines[3].trim(), 'base64');
    }
  }

  return {
    algorithm,
    keyId,
    signature,
    trustedComment,
    globalSignature,
  };
}

/**
 * Verify Ed25519 signature using Node.js crypto
 *
 * @param {Buffer} message - Message that was signed
 * @param {Buffer} signature - 64-byte Ed25519 signature
 * @param {Buffer} publicKey - 32-byte Ed25519 public key
 * @returns {boolean} True if signature is valid
 */
function verifyEd25519(message, signature, publicKey) {
  try {
    // Node.js 16+ supports Ed25519 natively
    const keyObject = crypto.createPublicKey({
      key: Buffer.concat([
        // Ed25519 public key DER prefix
        Buffer.from('302a300506032b6570032100', 'hex'),
        publicKey,
      ]),
      format: 'der',
      type: 'spki',
    });

    return crypto.verify(null, message, keyObject, signature);
  } catch (error) {
    // Fallback error - verification failed
    return false;
  }
}

/**
 * Verify manifest signature against pinned public key
 *
 * SECURITY: This function MUST be called BEFORE parsing the manifest YAML.
 * The manifest content should be treated as untrusted bytes until this returns valid.
 *
 * @param {Buffer} manifestContent - Raw manifest file content (NOT parsed)
 * @param {string} signatureContent - Content of .minisig signature file
 * @param {Object} [options] - Verification options
 * @param {Object} [options.publicKey] - Override public key (for testing only)
 * @returns {VerificationResult} Verification result
 */
function verifyManifestSignature(manifestContent, signatureContent, options = {}) {
  const result = {
    valid: false,
    error: null,
    keyId: null,
  };

  try {
    // Parse signature file
    const sig = parseMinisignSignature(signatureContent);

    // Verify algorithm
    if (sig.algorithm !== 'Ed') {
      result.error = 'Unsupported signature algorithm (expected Ed25519)';
      return result;
    }

    // Get public key (allow override for testing)
    const pubKey = options.publicKey || PINNED_PUBLIC_KEY;

    // Verify key ID matches
    const expectedKeyId = Buffer.from(pubKey.keyId, 'utf8');
    result.keyId = sig.keyId.toString('utf8').replace(/\0/g, '');

    if (!sig.keyId.slice(0, expectedKeyId.length).equals(expectedKeyId)) {
      result.error = `Key ID mismatch: expected ${pubKey.keyId}, got ${result.keyId}`;
      return result;
    }

    // Decode public key
    const publicKeyBytes = Buffer.from(pubKey.publicKey, 'base64');
    if (publicKeyBytes.length !== 32) {
      result.error = 'Invalid public key length';
      return result;
    }

    // Verify signature
    // Minisign signs: Blake2b-512(message) for prehashed mode, or message directly
    // For simplicity, we use direct message signing (small manifests)
    const isValid = verifyEd25519(manifestContent, sig.signature, publicKeyBytes);

    if (!isValid) {
      result.error = 'Signature verification failed';
      return result;
    }

    // If trusted comment exists, verify global signature
    if (sig.trustedComment && sig.globalSignature) {
      const globalMessage = Buffer.concat([sig.signature, Buffer.from(sig.trustedComment)]);
      const globalValid = verifyEd25519(globalMessage, sig.globalSignature, publicKeyBytes);
      if (!globalValid) {
        result.error = 'Trusted comment signature verification failed';
        return result;
      }
    }

    result.valid = true;
    return result;
  } catch (error) {
    result.error = `Signature parsing error: ${error.message}`;
    return result;
  }
}

/**
 * Check if signature file exists for a manifest
 *
 * @param {string} manifestPath - Path to manifest file
 * @returns {boolean} True if signature file exists
 */
function signatureExists(manifestPath) {
  return fs.existsSync(manifestPath + '.minisig');
}

/**
 * Load and verify manifest with signature
 *
 * @param {string} manifestPath - Path to manifest file
 * @param {Object} [options] - Options
 * @param {boolean} [options.requireSignature=true] - Fail if signature missing
 * @param {Object} [options.publicKey] - Override public key (testing only)
 * @returns {Object} { content: Buffer, verified: boolean, error: string|null }
 */
function loadAndVerifyManifest(manifestPath, options = {}) {
  const requireSignature = options.requireSignature !== false;
  const signaturePath = manifestPath + '.minisig';

  // Check manifest exists
  if (!fs.existsSync(manifestPath)) {
    return {
      content: null,
      verified: false,
      error: 'Manifest file not found',
    };
  }

  // Check signature exists
  if (!fs.existsSync(signaturePath)) {
    if (requireSignature) {
      return {
        content: null,
        verified: false,
        error: 'Manifest signature file not found (.minisig)',
      };
    }
    // Allow unsigned in dev mode (requireSignature=false)
    return {
      content: fs.readFileSync(manifestPath),
      verified: false,
      error: null,
    };
  }

  // Load files
  const manifestContent = fs.readFileSync(manifestPath);
  const signatureContent = fs.readFileSync(signaturePath, 'utf8');

  // Verify signature BEFORE any parsing
  const verifyResult = verifyManifestSignature(manifestContent, signatureContent, options);

  if (!verifyResult.valid) {
    return {
      content: null,
      verified: false,
      error: verifyResult.error,
    };
  }

  return {
    content: manifestContent,
    verified: true,
    error: null,
  };
}

module.exports = {
  verifyManifestSignature,
  signatureExists,
  loadAndVerifyManifest,
  parseMinisignSignature,
  PINNED_PUBLIC_KEY,
};
