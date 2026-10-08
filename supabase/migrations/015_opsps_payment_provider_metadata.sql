-- OpsPS payment provider metadata for secure sandbox checkout and webhook validation.
-- This migration is intentionally additive and preserves the existing tenant-scoped RLS model.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'
    CHECK (provider IN ('mock', 'stripe', 'sandbox', 'fpx', 'paynet'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_session_id TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS callback_event_id TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key
  ON public.payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_provider_session_id
  ON public.payments (provider_session_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON public.payments (provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_callback_event_id
  ON public.payments (callback_event_id);
