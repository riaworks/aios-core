/**
 * Post-Installation Validator Security Tests
 *
 * @module tests/installer/post-install-validator.test.js
 * @story 6.19 - Post-Installation Validation & Integrity Verification
 *
 * These tests verify security-critical behavior:
 * - Signature verification
 * - Path traversal prevention
 * - Symlink rejection
 * - Safe repair operations
 * - Quick mode safety
 */

'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {
  PostInstallValidator,
  isPathContained,
  validateManifestEntry,
  IssueType,
  Severity,
  SecurityLimits,
} = require('../../src/installer/post-install-validator');

describe('PostInstallValidator Security Tests', () => {
  let testDir;
  let targetDir;
  let sourceDir;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = path.join(os.tmpdir(), `aios-validator-test-${Date.now()}`);
    targetDir = path.join(testDir, 'target');
    sourceDir = path.join(testDir, 'source');

    await fs.ensureDir(path.join(targetDir, '.aios-core'));
    await fs.ensureDir(path.join(sourceDir, '.aios-core'));
  });

  afterEach(async () => {
    // Cleanup
    if (testDir && fs.existsSync(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('Path Containment (isPathContained)', () => {
    test('should allow paths within root', () => {
      expect(isPathContained('/root/dir/file.txt', '/root/dir')).toBe(true);
      expect(isPathContained('/root/dir/sub/file.txt', '/root/dir')).toBe(true);
    });

    test('should reject path traversal with ..', () => {
      const root = path.resolve('/root/dir');
      const malicious = path.resolve('/root/dir/../etc/passwd');
      expect(isPathContained(malicious, root)).toBe(false);
    });

    test('should reject paths outside root', () => {
      expect(isPathContained('/etc/passwd', '/root/dir')).toBe(false);
      expect(isPathContained('/root/other/file', '/root/dir')).toBe(false);
    });

    test('should handle Windows alternate data streams', () => {
      // Alternate data streams should be rejected
      expect(isPathContained('C:\\root\\file.txt:stream', 'C:\\root')).toBe(false);
      expect(isPathContained('/root/file.txt:hidden', '/root')).toBe(false);
    });

    test('should allow root directory itself', () => {
      expect(isPathContained('/root/dir', '/root/dir')).toBe(true);
    });

    if (process.platform === 'win32') {
      test('should handle Windows case-insensitivity', () => {
        expect(isPathContained('C:\\Root\\Dir\\file.txt', 'c:\\root\\dir')).toBe(true);
        expect(isPathContained('c:\\ROOT\\DIR\\FILE.TXT', 'C:\\root\\dir')).toBe(true);
      });
    }
  });

  describe('Manifest Entry Validation (validateManifestEntry)', () => {
    test('should accept valid entry', () => {
      const result = validateManifestEntry(
        {
          path: 'core/config.js',
          hash: 'sha256:' + 'a'.repeat(64),
          size: 1234,
        },
        0
      );
      expect(result.valid).toBe(true);
      expect(result.sanitized.path).toBe('core/config.js');
    });

    test('should reject unknown fields', () => {
      const result = validateManifestEntry(
        {
          path: 'file.txt',
          hash: 'sha256:' + 'a'.repeat(64),
          malicious: 'payload',
        },
        0
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("unknown field 'malicious'");
    });

    test('should reject path traversal in entry', () => {
      const result = validateManifestEntry({ path: '../../../etc/passwd' }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('..');
    });

    test('should reject null bytes in path', () => {
      const result = validateManifestEntry({ path: 'file\x00.txt' }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('null byte');
    });

    test('should reject absolute paths', () => {
      const result = validateManifestEntry({ path: '/etc/passwd' }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute path');
    });

    test('should reject excessively long paths', () => {
      const longPath = 'a'.repeat(SecurityLimits.MAX_PATH_LENGTH + 1);
      const result = validateManifestEntry({ path: longPath }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    test('should reject invalid hash format', () => {
      const result = validateManifestEntry({ path: 'file.txt', hash: 'md5:invalidhash' }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid hash format');
    });

    test('should reject negative size', () => {
      const result = validateManifestEntry({ path: 'file.txt', size: -1 }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('non-negative integer');
    });

    test('should reject non-file types', () => {
      const result = validateManifestEntry({ path: 'dir/', type: 'directory' }, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("only type 'file'");
    });

    test('should reject arrays as entries', () => {
      const result = validateManifestEntry(['not', 'an', 'object'], 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not an object');
    });
  });

  describe('Symlink Rejection', () => {
    test('should reject symlinks during validation', async () => {
      // Create a regular file and a symlink to it
      const realFile = path.join(targetDir, '.aios-core', 'real.txt');
      const symlink = path.join(targetDir, '.aios-core', 'link.txt');

      await fs.writeFile(realFile, 'content');

      // Create symlink (skip on Windows if not admin)
      try {
        await fs.symlink(realFile, symlink);
      } catch (e) {
        // Skip test on Windows without admin privileges
        if (e.code === 'EPERM') {
          console.log('Skipping symlink test - requires admin on Windows');
          return;
        }
        throw e;
      }

      // Create manifest pointing to symlink
      const manifest = {
        version: '1.0.0',
        files: [{ path: 'link.txt', hash: null, size: null }],
      };
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: link.txt'
      );

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
        verifyHashes: false,
      });

      const report = await validator.validate();

      // Should have a symlink rejection issue
      const symlinkIssue = report.issues.find((i) => i.type === IssueType.SYMLINK_REJECTED);
      expect(symlinkIssue).toBeDefined();
      expect(symlinkIssue.severity).toBe(Severity.CRITICAL);
    });
  });

  describe('Signature Verification', () => {
    test('should fail when signature is required but missing', async () => {
      // Create manifest without signature
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: test.txt'
      );

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: true, // Require signature
      });

      const report = await validator.validate();

      expect(report.status).toBe('failed');
      const sigIssue = report.issues.find(
        (i) => i.type === IssueType.SIGNATURE_MISSING || i.type === IssueType.SIGNATURE_INVALID
      );
      expect(sigIssue).toBeDefined();
      expect(sigIssue.severity).toBe(Severity.CRITICAL);
    });

    test('should allow validation without signature in dev mode', async () => {
      // Create valid manifest and file
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: test.txt\n    size: 4'
      );
      await fs.writeFile(path.join(targetDir, '.aios-core', 'test.txt'), 'test');

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false, // Dev mode
        verifyHashes: false,
      });

      const report = await validator.validate();

      // Should succeed without signature in dev mode
      expect(report.manifestVerified).toBe(false);
      expect(report.status).not.toBe('failed');
    });
  });

  describe('Quick Mode Safety (H2)', () => {
    test('should fail when size is missing in quick mode', async () => {
      // Create manifest without size
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: test.txt'
      );
      await fs.writeFile(path.join(targetDir, '.aios-core', 'test.txt'), 'content');

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
        verifyHashes: false, // Quick mode
      });

      const report = await validator.validate();

      const schemaIssue = report.issues.find((i) => i.type === IssueType.SCHEMA_VIOLATION);
      expect(schemaIssue).toBeDefined();
      expect(schemaIssue.message).toContain('Missing size');
    });

    test('should fail on size mismatch in quick mode', async () => {
      // Create manifest with wrong size
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: test.txt\n    size: 999'
      );
      await fs.writeFile(path.join(targetDir, '.aios-core', 'test.txt'), 'small');

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
        verifyHashes: false,
      });

      const report = await validator.validate();

      const sizeIssue = report.issues.find((i) => i.type === IssueType.SIZE_MISMATCH);
      expect(sizeIssue).toBeDefined();
      expect(report.stats.corruptedFiles).toBe(1);
    });
  });

  describe('Secure Repair (C4)', () => {
    test('should refuse repair without hash verification', async () => {
      const validator = new PostInstallValidator(targetDir, sourceDir, {
        requireSignature: false,
        verifyHashes: false, // Disabled
      });

      const result = await validator.repair();

      expect(result.success).toBe(false);
      expect(result.error).toContain('hash verification');
    });

    test('should refuse repair without verified manifest', async () => {
      // Setup manifest
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        `version: "1.0.0"\nfiles:\n  - path: test.txt\n    hash: "sha256:${'a'.repeat(64)}"\n    size: 4`
      );

      const validator = new PostInstallValidator(targetDir, sourceDir, {
        requireSignature: true, // Requires signature
        verifyHashes: true,
      });

      // Validate first (will fail due to missing signature)
      await validator.validate();

      // Try repair
      const result = await validator.repair();

      expect(result.success).toBe(false);
      expect(result.error).toContain('verified manifest');
    });

    test('should verify source hash before copying', async () => {
      // Create source file with different content than manifest hash
      const sourceFile = path.join(sourceDir, '.aios-core', 'test.txt');
      await fs.writeFile(sourceFile, 'wrong content');

      // Create manifest with different hash
      const manifest = `version: "1.0.0"
files:
  - path: test.txt
    hash: "sha256:${'a'.repeat(64)}"
    size: 13`;

      await fs.writeFile(path.join(targetDir, '.aios-core', 'install-manifest.yaml'), manifest);
      await fs.writeFile(path.join(sourceDir, '.aios-core', 'install-manifest.yaml'), manifest);

      const validator = new PostInstallValidator(targetDir, sourceDir, {
        requireSignature: false, // For testing
        verifyHashes: true,
      });

      // Manually set manifestVerified for testing
      validator.manifestVerified = true;

      // Validate (will find missing file)
      await validator.validate();

      // Manually add a missing file issue for repair
      validator.issues = [
        {
          type: IssueType.MISSING_FILE,
          relativePath: 'test.txt',
          message: 'Missing file: test.txt',
        },
      ];
      validator.manifest = {
        files: [{ path: 'test.txt', hash: `sha256:${'a'.repeat(64)}`, size: 13 }],
      };

      const result = await validator.repair();

      // Should fail because source hash doesn't match manifest
      expect(result.success).toBe(false);
      const failedItem = result.failed.find((f) => f.path === 'test.txt');
      expect(failedItem).toBeDefined();
      expect(failedItem.reason).toContain('hash does not match');
    });
  });

  describe('Hash Error Handling (H3)', () => {
    test('should treat hash errors as failures', async () => {
      // Create a file that will cause hash error (e.g., directory instead of file)
      const dirPath = path.join(targetDir, '.aios-core', 'notafile');
      await fs.ensureDir(dirPath);

      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        `version: "1.0.0"\nfiles:\n  - path: notafile\n    hash: "sha256:${'a'.repeat(64)}"\n    size: 0`
      );

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
        verifyHashes: true,
      });

      const report = await validator.validate();

      // Should be treated as invalid path (directory, not file)
      const issue = report.issues.find(
        (i) => i.type === IssueType.INVALID_PATH || i.type === IssueType.HASH_ERROR
      );
      expect(issue).toBeDefined();
    });
  });

  describe('DoS Protection (H6)', () => {
    test('should enforce max file count in manifest', async () => {
      // Create manifest with too many files
      const files = [];
      for (let i = 0; i < SecurityLimits.MAX_FILE_COUNT + 1; i++) {
        files.push(`  - path: file${i}.txt`);
      }

      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        `version: "1.0.0"\nfiles:\n${files.join('\n')}`
      );

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
      });

      const report = await validator.validate();

      expect(report.status).toBe('failed');
      const manifestIssue = report.issues.find((i) => i.type === IssueType.INVALID_MANIFEST);
      expect(manifestIssue).toBeDefined();
      expect(manifestIssue.details).toContain('too many files');
    });

    test('should enforce max manifest size', async () => {
      // Create oversized manifest
      const bigContent = 'a'.repeat(SecurityLimits.MAX_MANIFEST_SIZE + 1);

      await fs.writeFile(path.join(targetDir, '.aios-core', 'install-manifest.yaml'), bigContent);

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
      });

      const report = await validator.validate();

      expect(report.status).toBe('failed');
    });
  });

  describe('Issue Model (H4)', () => {
    test('should store relativePath in issue objects', async () => {
      await fs.writeFile(
        path.join(targetDir, '.aios-core', 'install-manifest.yaml'),
        'version: "1.0.0"\nfiles:\n  - path: missing.txt\n    size: 10'
      );

      const validator = new PostInstallValidator(targetDir, null, {
        requireSignature: false,
        verifyHashes: false,
      });

      const report = await validator.validate();

      const missingIssue = report.issues.find((i) => i.type === IssueType.MISSING_FILE);
      expect(missingIssue).toBeDefined();
      expect(missingIssue.relativePath).toBe('missing.txt');
    });
  });
});

describe('Manifest Signature Module', () => {
  const {
    parseMinisignSignature,
    verifyManifestSignature,
  } = require('../../src/installer/manifest-signature');

  test('should parse valid minisign signature format', () => {
    const validSig = `untrusted comment: signature from minisign
RWQBla1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/==
trusted comment: timestamp:1234567890
QRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL+/==`;

    expect(() => parseMinisignSignature(validSig)).not.toThrow();
  });

  test('should reject signature without untrusted comment', () => {
    const invalidSig = `not a valid comment
RWQBla1234567890`;

    expect(() => parseMinisignSignature(invalidSig)).toThrow('missing untrusted comment');
  });

  test('should reject signature with insufficient lines', () => {
    const invalidSig = 'untrusted comment: only one line';

    expect(() => parseMinisignSignature(invalidSig)).toThrow('insufficient lines');
  });

  test('should reject signature that is too short', () => {
    const invalidSig = `untrusted comment: test
short`;

    expect(() => parseMinisignSignature(invalidSig)).toThrow('signature too short');
  });
});
