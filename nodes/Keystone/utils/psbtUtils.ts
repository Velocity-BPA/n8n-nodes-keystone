/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * PSBT (Partially Signed Bitcoin Transaction) Utilities
 *
 * Utilities for working with BIP-174 PSBTs for air-gapped
 * Bitcoin transaction signing with Keystone.
 */

/**
 * PSBT Input
 */
export interface PSBTInput {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey?: string;
  witnessUtxo?: {
    script: string;
    value: number;
  };
  nonWitnessUtxo?: string;
  redeemScript?: string;
  witnessScript?: string;
  bip32Derivation?: Array<{
    pubkey: string;
    masterFingerprint: string;
    path: string;
  }>;
  partialSig?: Array<{
    pubkey: string;
    signature: string;
  }>;
  sighashType?: number;
}

/**
 * PSBT Output
 */
export interface PSBTOutput {
  address?: string;
  script?: string;
  value: number;
  redeemScript?: string;
  witnessScript?: string;
  bip32Derivation?: Array<{
    pubkey: string;
    masterFingerprint: string;
    path: string;
  }>;
}

/**
 * PSBT Global
 */
export interface PSBTGlobal {
  unsignedTx?: string;
  xpub?: Array<{
    xpub: string;
    masterFingerprint: string;
    path: string;
  }>;
  version?: number;
}

/**
 * Full PSBT Structure
 */
export interface PSBT {
  global: PSBTGlobal;
  inputs: PSBTInput[];
  outputs: PSBTOutput[];
  raw?: string;
}

/**
 * PSBT Signing Status
 */
export interface PSBTSigningStatus {
  isComplete: boolean;
  inputsTotal: number;
  inputsSigned: number;
  signaturesNeeded: number;
  signaturesHave: number;
}

/**
 * PSBT Magic Bytes
 */
const PSBT_MAGIC = '70736274ff'; // "psbt" + 0xff

/**
 * Validate PSBT format
 *
 * @param psbtData - PSBT data (hex or base64)
 * @returns Validation result
 */
export const validatePSBT = (psbtData: string): {
  valid: boolean;
  format?: 'hex' | 'base64';
  error?: string;
} => {
  if (!psbtData || psbtData.length === 0) {
    return { valid: false, error: 'Empty PSBT data' };
  }

  // Try hex format
  if (/^[0-9a-fA-F]+$/.test(psbtData)) {
    if (psbtData.toLowerCase().startsWith(PSBT_MAGIC)) {
      return { valid: true, format: 'hex' };
    }
  }

  // Try base64 format
  try {
    const decoded = Buffer.from(psbtData, 'base64').toString('hex');
    if (decoded.toLowerCase().startsWith(PSBT_MAGIC)) {
      return { valid: true, format: 'base64' };
    }
  } catch {
    // Not valid base64
  }

  return { valid: false, error: 'Invalid PSBT format: must start with magic bytes' };
};

/**
 * Parse PSBT from hex or base64
 *
 * @param psbtData - PSBT data
 * @returns Parsed PSBT structure
 */
export const parsePSBT = (psbtData: string): PSBT => {
  const validation = validatePSBT(psbtData);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let hex: string;
  if (validation.format === 'base64') {
    hex = Buffer.from(psbtData, 'base64').toString('hex');
  } else {
    hex = psbtData.toLowerCase();
  }

  // Basic PSBT parsing (simplified)
  // Full implementation would use bitcoinjs-lib
  return {
    global: {
      version: 0,
    },
    inputs: [],
    outputs: [],
    raw: hex,
  };
};

/**
 * Get PSBT signing status
 *
 * @param psbt - PSBT to check
 * @returns Signing status
 */
export const getPSBTSigningStatus = (psbt: PSBT): PSBTSigningStatus => {
  let inputsSigned = 0;
  let signaturesNeeded = 0;
  let signaturesHave = 0;

  for (const input of psbt.inputs) {
    // Check for partial signatures
    if (input.partialSig && input.partialSig.length > 0) {
      signaturesHave += input.partialSig.length;
      inputsSigned++;
    }

    // Estimate signatures needed (simplified)
    signaturesNeeded++;
  }

  return {
    isComplete: inputsSigned === psbt.inputs.length,
    inputsTotal: psbt.inputs.length,
    inputsSigned,
    signaturesNeeded,
    signaturesHave,
  };
};

/**
 * Create unsigned PSBT
 *
 * @param inputs - Transaction inputs
 * @param outputs - Transaction outputs
 * @returns PSBT hex
 */
export const createPSBT = (
  inputs: Array<{
    txid: string;
    vout: number;
    value: number;
    derivationPath?: string;
  }>,
  outputs: Array<{
    address: string;
    value: number;
  }>,
): string => {
  // This would use bitcoinjs-lib in production
  // Simplified placeholder
  const psbt: PSBT = {
    global: {
      version: 0,
    },
    inputs: inputs.map(i => ({
      txid: i.txid,
      vout: i.vout,
      value: i.value,
    })),
    outputs: outputs.map(o => ({
      address: o.address,
      value: o.value,
    })),
  };

  // Return placeholder hex
  return PSBT_MAGIC + '00';
};

/**
 * Combine multiple PSBTs
 *
 * @param psbts - Array of PSBTs to combine
 * @returns Combined PSBT
 */
export const combinePSBTs = (psbts: PSBT[]): PSBT => {
  if (psbts.length === 0) {
    throw new Error('No PSBTs to combine');
  }

  const combined: PSBT = {
    global: { ...psbts[0].global },
    inputs: [...psbts[0].inputs],
    outputs: [...psbts[0].outputs],
  };

  // Merge signatures from all PSBTs
  for (let i = 1; i < psbts.length; i++) {
    const psbt = psbts[i];

    for (let j = 0; j < psbt.inputs.length; j++) {
      if (psbt.inputs[j].partialSig) {
        if (!combined.inputs[j].partialSig) {
          combined.inputs[j].partialSig = [];
        }
        combined.inputs[j].partialSig!.push(...psbt.inputs[j].partialSig!);
      }
    }
  }

  return combined;
};

/**
 * Finalize PSBT
 *
 * @param psbt - PSBT to finalize
 * @returns Finalized PSBT
 */
export const finalizePSBT = (psbt: PSBT): PSBT => {
  const status = getPSBTSigningStatus(psbt);

  if (!status.isComplete) {
    throw new Error(
      `Cannot finalize: only ${status.inputsSigned}/${status.inputsTotal} inputs signed`
    );
  }

  // Mark as finalized
  return {
    ...psbt,
    global: {
      ...psbt.global,
    },
  };
};

/**
 * Extract signed transaction from finalized PSBT
 *
 * @param psbt - Finalized PSBT
 * @returns Transaction hex
 */
export const extractTransaction = (psbt: PSBT): string => {
  // This would extract the final transaction
  // Simplified placeholder
  return '0200000001...'; // Placeholder tx hex
};

/**
 * Convert PSBT to base64
 *
 * @param psbtHex - PSBT in hex format
 * @returns PSBT in base64 format
 */
export const psbtToBase64 = (psbtHex: string): string => {
  return Buffer.from(psbtHex, 'hex').toString('base64');
};

/**
 * Convert PSBT from base64 to hex
 *
 * @param psbtBase64 - PSBT in base64 format
 * @returns PSBT in hex format
 */
export const psbtFromBase64 = (psbtBase64: string): string => {
  return Buffer.from(psbtBase64, 'base64').toString('hex');
};

/**
 * Add BIP32 derivation info to PSBT input
 *
 * @param psbt - PSBT to modify
 * @param inputIndex - Input index
 * @param pubkey - Public key hex
 * @param masterFingerprint - Master fingerprint hex
 * @param path - Derivation path
 * @returns Modified PSBT
 */
export const addBIP32Derivation = (
  psbt: PSBT,
  inputIndex: number,
  pubkey: string,
  masterFingerprint: string,
  path: string,
): PSBT => {
  if (inputIndex >= psbt.inputs.length) {
    throw new Error(`Input index ${inputIndex} out of range`);
  }

  const modified = { ...psbt };
  const input = { ...modified.inputs[inputIndex] };

  if (!input.bip32Derivation) {
    input.bip32Derivation = [];
  }

  input.bip32Derivation.push({
    pubkey,
    masterFingerprint,
    path,
  });

  modified.inputs[inputIndex] = input;
  return modified;
};

/**
 * Get total input value
 *
 * @param psbt - PSBT to check
 * @returns Total input value in satoshis
 */
export const getTotalInputValue = (psbt: PSBT): number => {
  return psbt.inputs.reduce((sum, input) => sum + (input.value || 0), 0);
};

/**
 * Get total output value
 *
 * @param psbt - PSBT to check
 * @returns Total output value in satoshis
 */
export const getTotalOutputValue = (psbt: PSBT): number => {
  return psbt.outputs.reduce((sum, output) => sum + (output.value || 0), 0);
};

/**
 * Calculate fee from PSBT
 *
 * @param psbt - PSBT to check
 * @returns Fee in satoshis
 */
export const calculateFee = (psbt: PSBT): number => {
  return getTotalInputValue(psbt) - getTotalOutputValue(psbt);
};
