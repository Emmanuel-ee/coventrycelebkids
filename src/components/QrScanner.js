
import React, { useRef, useCallback, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

/**
 * QrScanner component
 * Handles camera access and QR code scanning, with robust cleanup for all devices.
 */
const QrScanner = ({ isActive, onScan, onError }) => {
  const videoRef = useRef(null);

  // Ignore common non-fatal scanning errors
  const shouldIgnoreError = useCallback((error) => {
    if (!error) return true;
    const name = typeof error === 'string' ? error : error.name || '';
    const message = typeof error === 'string' ? error : error.message || '';
    const combined = `${name} ${message}`.toLowerCase();
    return [
      'notfoundexception',
      'checksumexception',
      'formatexception',
      'no code found',
    ].some((token) => combined.includes(token));
  }, []);

  useEffect(() => {
    if (!isActive || !videoRef.current) return undefined;

    const codeReader = new BrowserQRCodeReader();
    let isCancelled = false;
    const videoEl = videoRef.current;

    // Start decoding from the video device
    const decodePromise = codeReader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
      if (isCancelled) return;
      if (result) onScan(result.getText());
      if (error && onError && !shouldIgnoreError(error)) onError(error);
    });

    // Handle unexpected errors
    if (decodePromise && typeof decodePromise.catch === 'function') {
      decodePromise.catch((scanError) => {
        if (!isCancelled && onError && !shouldIgnoreError(scanError)) {
          onError(scanError);
        }
      });
    }

    // Cleanup: stop camera and release resources
    return () => {
      isCancelled = true;
      if (typeof codeReader.destroy === 'function') codeReader.destroy();
      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getTracks?.();
        if (tracks && tracks.length) tracks.forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    };
  }, [isActive, onScan, onError, shouldIgnoreError]);

  return (
    <div className="qr-scanner">
      <video
        ref={videoRef}
        className="qr-scanner__video"
        muted
        playsInline
      />
    </div>
  );
};

export default QrScanner;