function isSet(value: string | undefined) {
  return !!value && !value.startsWith("your_");
}

/** Which checkout payment methods are fully configured on this deployment.
 * Unconfigured gateways are hidden from customers instead of failing at checkout. */
export function availablePaymentMethods() {
  const env = process.env;
  return {
    card: isSet(env.SAFEPAY_API_KEY) && isSet(env.SAFEPAY_SECRET_KEY),
    jazzcash:
      isSet(env.JAZZCASH_MERCHANT_ID) && isSet(env.JAZZCASH_PASSWORD) && isSet(env.JAZZCASH_INTEGRITY_SALT),
    easypaisa: env.EASYPAISA_ENABLED === "true" && isSet(env.EASYPAISA_STORE_ID) && isSet(env.EASYPAISA_HASH_KEY),
    cod: true,
  };
}
