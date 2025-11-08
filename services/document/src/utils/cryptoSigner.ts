import crypto from 'crypto';

export class CryptoSigner {
  /**
   * Generate SHA-256 signature for approval action
   */
  static signApprovalAction(data: {
    userId: number;
    documentId: string;
    action: string;
    timestamp: Date;
    previousHash?: string;
  }): string {
    const payload = JSON.stringify({
      ...data,
      timestamp: data.timestamp.toISOString(),
    });
    
    return crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate hash chain signature for audit logs
   */
  static generateAuditSignature(data: {
    documentId: string;
    userId: number;
    action: string;
    timestamp: Date;
    previousHash: string;
  }): string {
    const payload = JSON.stringify({
      ...data,
      timestamp: data.timestamp.toISOString(),
    });
    
    return crypto
      .createHash('sha256')
      .update(payload + data.previousHash)
      .digest('hex');
  }

  /**
   * Verify hash chain integrity
   */
  static verifyHashChain(
    logs: Array<{
      signature: string;
      previousHash: string;
      documentId: string;
      userId: number;
      action: string;
      timestamp: Date;
    }>
  ): boolean {
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const expectedSignature = this.generateAuditSignature({
        documentId: log.documentId,
        userId: log.userId,
        action: log.action,
        timestamp: log.timestamp,
        previousHash: log.previousHash,
      });

      if (expectedSignature !== log.signature) {
        console.error(`Hash chain broken at index ${i}`);
        return false;
      }
    }
    return true;
  }
}