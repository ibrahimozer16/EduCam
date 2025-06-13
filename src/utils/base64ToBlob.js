import { toByteArray } from 'base64-js';

export function base64ToBlob(base64, contentType = '') {
  const byteArray = toByteArray(base64);
  return new Blob([byteArray], { type: contentType });
}
