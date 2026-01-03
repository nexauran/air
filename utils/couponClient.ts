// utils/couponClient.ts
export type ApplyCouponResult = {
  success: true;
  code: string;
  discount: number;
  newTotal: number;
};

export async function applyCoupon(
  code: string,
  userId: string | undefined,
  cartTotal: number
): Promise<ApplyCouponResult> {
  const res = await fetch('/api/apply-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, userId, cartTotal }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to apply coupon');
  }
  return data as ApplyCouponResult;
}
