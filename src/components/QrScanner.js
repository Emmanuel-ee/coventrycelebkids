import React from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

const QrScanner = ({ isActive, onScan, onError }) => {
  const videoRef = React.useRef(null);
  const shouldIgnoreError = React.useCallback((error) => {
    if (!error) {
      return true;
    }
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

  React.useEffect(() => {
    if (!isActive || !videoRef.current) {
      return undefined;
    }

    const codeReader = new BrowserQRCodeReader();
    let isCancelled = false;

    const decodePromise = codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
      if (isCancelled) {
        return;
      }
      if (result) {
        onScan(result.getText());
      }
      if (error && onError && !shouldIgnoreError(error)) {
        onError(error);
      }
    });
    if (decodePromise && typeof decodePromise.catch === 'function') {
      decodePromise.catch((scanError) => {
        if (!isCancelled && onError && !shouldIgnoreError(scanError)) {
          onError(scanError);
        }
      });
    }

    return () => {
      isCancelled = true;
      codeReader.reset();
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