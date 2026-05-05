"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRef } from "react";

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function HCaptchaField({ onVerify, onExpire }: Props) {
  const ref = useRef<HCaptcha>(null);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  if (!siteKey) return null; // non configuré en dev

  return (
    <HCaptcha
      ref={ref}
      sitekey={siteKey}
      onVerify={onVerify}
      onExpire={() => { onVerify(""); onExpire?.(); }}
      theme="light"
      size="normal"
    />
  );
}
