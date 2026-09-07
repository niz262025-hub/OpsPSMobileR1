-- OpsPS Phase 4C: payment lifecycle update policy with tenant isolation.
-- This is intentionally a forward-only migration. It preserves RLS, requires an authenticated
-- founder/admin member of the payment's business, and prevents tenant escape by preventing
-- business_id/order_id reassignment during update.

DROP POLICY IF EXISTS "payments_member_update" ON public.payments;
CREATE POLICY "payments_member_update"
  ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_memberships bm
      WHERE bm.business_id = payments.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('founder', 'admin')
    )
    AND (
      SELECT existing.business_id
      FROM public.payments existing
      WHERE existing.id = payments.id
    ) = payments.business_id
    AND (
      (
        SELECT existing.order_id
        FROM public.payments existing
        WHERE existing.id = payments.id
      ) IS NULL
      OR (
        SELECT existing.order_id
        FROM public.payments existing
        WHERE existing.id = payments.id
      ) = payments.order_id
    )
  );
