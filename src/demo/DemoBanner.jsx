import React, { useEffect, useState } from 'react';
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD } from './config';
import { resetDemoData } from './installMockApi';
import './DemoBanner.css';

const QUICK_LINKS = [
  { label: 'Customer site', href: '/' },
  { label: 'Studios for rent', href: '/studios' },
  { label: 'Apartments for sale', href: '/buy-apartments' },
  { label: 'Admin sign in', href: '/admin' },
  { label: 'Master admin sign in', href: '/master-admin/login' },
];

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard blocked: the value is visible and can be selected by hand
    }
  };

  return (
    <button type="button" className="demo-copy" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function DemoBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Render nothing during SSR / first paint so server and client markup match.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!DEMO_MODE || !mounted) return null;

  const handleReset = () => {
    if (window.confirm('Reset all demo data and sign out? Anything added or changed in this demo will be lost.')) {
      resetDemoData();
    }
  };

  return (
    <div className="demo-root">
      {open && (
        <div className="demo-panel" role="dialog" aria-label="Demo information">
          <div className="demo-panel-head">
            <strong>Demo mode</strong>
            <button type="button" className="demo-close" onClick={() => setOpen(false)} aria-label="Close demo panel">
              &times;
            </button>
          </div>
          <p className="demo-text">
            This is a preview with sample data. Nothing is sent to a server, and every change you make is stored only in
            this browser.
          </p>

          <h4 className="demo-h">Sample sign-ins</h4>
          <p className="demo-text demo-text-small">
            Password for all accounts: <code>{DEMO_PASSWORD}</code> <CopyButton value={DEMO_PASSWORD} label="password" />
          </p>
          <ul className="demo-accounts">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.key}>
                <div className="demo-account-top">
                  <span className="demo-role">{a.role}</span>
                  <a href={a.loginPath} className="demo-login-link">
                    Open sign in
                  </a>
                </div>
                <div className="demo-account-line">
                  <code>{a.email}</code> <CopyButton value={a.email} label={`${a.role} email`} />
                </div>
                <div className="demo-desc">{a.description}</div>
              </li>
            ))}
          </ul>

          <h4 className="demo-h">Jump to</h4>
          <div className="demo-links">
            {QUICK_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <button type="button" className="demo-reset" onClick={handleReset}>
            Reset demo data
          </button>
        </div>
      )}

      <button
        type="button"
        className="demo-pill"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Demo information"
      >
        <span className="demo-dot" aria-hidden="true" />
        Demo &middot; sample data
      </button>
    </div>
  );
}
