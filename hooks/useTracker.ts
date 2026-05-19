'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const BOT_RE = /bot|crawl|spider|scrape|headless|slurp|facebook|twitter|discord|telegram|whatsapp/i;

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return BOT_RE.test(navigator.userAgent);
}

function getDeviceId(): string {
  const key = 'track_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useTracker() {
  const pathname = usePathname();
  const deviceIdRef = useRef<string>('');
  const lastPageRef = useRef<string>('');

  useEffect(() => {
    if (isBot()) return;
    deviceIdRef.current = getDeviceId();
  }, []);

  const sendHeartbeat = (page: string) => {
    const device_id = deviceIdRef.current;
    if (!device_id) return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, current_page: page }),
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    const page = pathname;
    if (page === lastPageRef.current) return;
    lastPageRef.current = page;
    sendHeartbeat(page);
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sendHeartbeat(pathname);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);
}
