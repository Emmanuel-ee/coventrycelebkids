import React from 'react';
import QrScanner from './QrScanner';

/**
 * Header for the check-in card, with camera toggle.
 */
function CheckinHeader({ isScannerActive, onToggleScanner, isCheckinAllowed }) {
  return (
    <div className="card__header">
      <div>
        <h2>Drop-off &amp; Pick-up</h2>
        <p className="card__subtitle">
          Use the camera to scan a child QR code to sign in or out. Manual search is disabled.
        </p>
      </div>
      <button
        type="button"
        className="ghost"
        onClick={onToggleScanner}
        disabled={!isCheckinAllowed}
      >
        {isScannerActive ? 'Stop camera' : 'Open camera'}
      </button>
    </div>
  );
}

/**
 * Section for the QR scanner and scan notice.
 */
function ScannerSection({ isScannerActive, onScan, onScanError, scanNotice }) {
  if (!isScannerActive) return null;
  return (
    <>
      <QrScanner isActive={isScannerActive} onScan={onScan} onError={onScanError} />
      {scanNotice && <p className="scan-notice">{scanNotice}</p>}
    </>
  );
}

/**
 * Main check-in view: camera toggle, QR scanner, and scan notice.
 */
function CheckinView({
  isScannerActive,
  onToggleScanner,
  scanNotice,
  onScan,
  onScanError,
  isCheckinAllowed,
}) {
  return (
    <section className="card">
      <CheckinHeader
        isScannerActive={isScannerActive}
        onToggleScanner={onToggleScanner}
        isCheckinAllowed={isCheckinAllowed}
      />
      <ScannerSection
        isScannerActive={isScannerActive}
        onScan={onScan}
        onScanError={onScanError}
        scanNotice={scanNotice}
      />
    </section>
  );
}

export default CheckinView;
