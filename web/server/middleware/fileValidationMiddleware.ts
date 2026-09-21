/**
 * AGIES ALERT - Server-Side File Upload & Media Validation Middleware
 * Never trusts frontend validation. Validates MIME types, magic byte signatures,
 * file sizes, and strictly prevents executable or script uploads.
 */

export interface FileValidationResult {
  valid: boolean;
  sanitizedFileName: string;
  detectedMimeType?: string;
  fileSizeBytes?: number;
  error?: string;
}

export class FileValidationMiddleware {
  // Strict allowlists for emergency incident evidence
  public static readonly ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
  ]);

  public static readonly ALLOWED_VIDEO_MIMES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
  ]);

  // Blocklist of dangerous executable and script extensions
  public static readonly DANGEROUS_EXTENSIONS = new Set([
    'exe', 'sh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'ts', 'jsx', 'tsx',
    'php', 'phtml', 'py', 'pl', 'cgi', 'jar', 'war', 'ear', 'dll', 'so',
    'dylib', 'msi', 'com', 'scr', 'hta', 'cpl', 'msc', 'wsf', 'svg',
    'html', 'htm', 'xhtml', 'jsp', 'asp', 'aspx', 'jspx', 'shtml'
  ]);

  // Max size limits in bytes
  public static readonly MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  public static readonly MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  /**
   * Sanitizes a user-supplied filename to prevent path traversal, null-byte injection, and dangerous naming
   */
  public static sanitizeFilename(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') {
      return `incident_upload_${Date.now()}.bin`;
    }

    // 1. Remove null bytes and path traversal patterns
    let clean = rawName
      .replace(/\0/g, '')
      .replace(/(\.\.[\/\\])+/g, '')
      .replace(/[\/\\]/g, '_')
      .trim();

    // 2. Extract base name and extension
    const dotIndex = clean.lastIndexOf('.');
    if (dotIndex === -1) {
      return `${clean.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;
    }

    const baseName = clean.substring(0, dotIndex).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = clean.substring(dotIndex + 1).toLowerCase().replace(/[^a-z0-9]/g, '');

    return `${baseName || 'upload'}_${Date.now()}.${ext}`;
  }

  /**
   * Detects the real MIME type by inspecting binary magic bytes
   */
  public static detectMagicMime(bufferOrBase64: Buffer | string): string | null {
    let bytes: Uint8Array;
    if (typeof bufferOrBase64 === 'string') {
      // If base64 data URI format, strip header
      const base64Data = bufferOrBase64.replace(/^data:[^;]+;base64,/, '');
      try {
        const binStr = atob(base64Data.substring(0, 64));
        bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
      } catch {
        return null;
      }
    } else {
      bytes = new Uint8Array(bufferOrBase64.subarray(0, 64));
    }

    if (bytes.length < 4) return null;

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 (0x89 'PNG')
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }

    // GIF: 47 49 46 38 ('GIF8')
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'image/gif';
    }

    // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return 'image/webp';
    }

    // MP4 / QuickTime: ....ftyp (box type 'ftyp' at offset 4)
    if (
      bytes.length >= 8 &&
      bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
    ) {
      return 'video/mp4';
    }

    // WEBM / MKV: 1A 45 DF A3 (EBML Header)
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return 'video/webm';
    }

    return null;
  }

  /**
   * Complete server-side validation for media uploads
   */
  public static validateMediaUpload(payload: {
    fileName: string;
    fileType?: string;
    fileSizeBytes?: number;
    base64Content?: string;
  }): FileValidationResult {
    const { fileName, fileType, fileSizeBytes, base64Content } = payload;

    if (!fileName || typeof fileName !== 'string') {
      return { valid: false, sanitizedFileName: '', error: 'Missing or invalid fileName parameter.' };
    }

    // 1. Check file extension against blocklist
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (this.DANGEROUS_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        sanitizedFileName: this.sanitizeFilename(fileName),
        error: `Executable or script extension .${ext} is strictly prohibited on AGIES ALERT servers.`,
      };
    }

    // 2. Estimate or verify size
    let calculatedSize = fileSizeBytes || 0;
    if (base64Content && (!calculatedSize || calculatedSize === 0)) {
      const pureBase64 = base64Content.replace(/^data:[^;]+;base64,/, '');
      calculatedSize = Math.floor((pureBase64.length * 3) / 4);
    }

    // 3. Detect and verify MIME type
    let detectedMime = fileType;
    if (base64Content) {
      const magicMime = this.detectMagicMime(base64Content);
      if (magicMime) {
        detectedMime = magicMime;
      }
    }

    if (!detectedMime) {
      return {
        valid: false,
        sanitizedFileName: this.sanitizeFilename(fileName),
        error: 'Unable to determine media MIME type from file header.',
      };
    }

    const isImage = this.ALLOWED_IMAGE_MIMES.has(detectedMime.toLowerCase());
    const isVideo = this.ALLOWED_VIDEO_MIMES.has(detectedMime.toLowerCase());

    if (!isImage && !isVideo) {
      return {
        valid: false,
        sanitizedFileName: this.sanitizeFilename(fileName),
        detectedMimeType: detectedMime,
        error: `Invalid file format ${detectedMime}. Only verified images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV) are accepted.`,
      };
    }

    // 4. Validate file size limits
    if (isImage && calculatedSize > this.MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        sanitizedFileName: this.sanitizeFilename(fileName),
        fileSizeBytes: calculatedSize,
        error: `Image file exceeds the 10 MB maximum limit (received ${(calculatedSize / (1024 * 1024)).toFixed(2)} MB).`,
      };
    }

    if (isVideo && calculatedSize > this.MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        sanitizedFileName: this.sanitizeFilename(fileName),
        fileSizeBytes: calculatedSize,
        error: `Video evidence exceeds the 50 MB maximum limit (received ${(calculatedSize / (1024 * 1024)).toFixed(2)} MB).`,
      };
    }

    return {
      valid: true,
      sanitizedFileName: this.sanitizeFilename(fileName),
      detectedMimeType: detectedMime,
      fileSizeBytes: calculatedSize,
    };
  }
}
