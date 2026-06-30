interface OtpEntry {
  otp: string;
  expiresAt: number;
  data?: any;
}

class OtpStore {
  private store = new Map<string, OtpEntry>();

  /**
   * Store an OTP for a given key with a TTL in milliseconds.
   */
  set(key: string, otp: string, ttlMs: number, data?: any) {
    this.store.set(key, {
      otp,
      expiresAt: Date.now() + ttlMs,
      data
    });
  }

  /**
   * Get the active OTP entry for a given key.
   * Automatically deletes expired entries.
   */
  get(key: string): OtpEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  /**
   * Verify if the provided OTP matches the stored OTP for the key.
   * If correct, the OTP is consumed and deleted.
   */
  verify(key: string, otp: string): boolean {
    const entry = this.get(key);
    if (!entry) return false;
    const isCorrect = entry.otp === otp;
    if (isCorrect) {
      this.store.delete(key);
    }
    return isCorrect;
  }

  /**
   * Delete an OTP entry manually.
   */
  delete(key: string) {
    this.store.delete(key);
  }
}

export const otpStore = new OtpStore();
