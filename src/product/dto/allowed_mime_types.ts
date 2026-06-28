const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',

  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',

  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/flac',
  'audio/ogg',

  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',

  // Images
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',

  // Fonts
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
];

export function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}
