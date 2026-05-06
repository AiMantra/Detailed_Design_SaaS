import CryptoJS from 'crypto-js';

// In-memory storage for the current encryption key
let currentEncryptionKey = null;

// Store original methods
const originalSessionStorage = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key
};

// Set the encryption key (call this after login)
export const setEncryptionKey = (key) => {
    if (!key) {
        console.warn('No encryption key provided');
        return false;
    }
    currentEncryptionKey = key;
    console.log('🔐 Encryption key set successfully');
    return true;
};

// Clear encryption key (call on logout)
export const clearEncryptionKey = () => {
    currentEncryptionKey = null;
    console.log('🔐 Encryption key cleared');
};

// Get current encryption key (for debugging)
export const getCurrentEncryptionKey = () => currentEncryptionKey;

// Check if a value looks like it's encrypted (AES encrypted strings start with "U2FsdGVkX1")
const isEncrypted = (value) => {
    return typeof value === 'string' && value.startsWith('U2FsdGVkX1');
};

// Encrypt function using AES encryption
const encrypt = (text) => {
    if (!text || !currentEncryptionKey) {
        return text;
    }

    try {
        const stringified = typeof text === 'string' ? text : JSON.stringify(text);
        const encrypted = CryptoJS.AES.encrypt(stringified, currentEncryptionKey).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
};

// Decrypt function using AES encryption
const decrypt = (encryptedText) => {
    if (!encryptedText || !currentEncryptionKey) {
        return encryptedText;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, currentEncryptionKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            return encryptedText;
        }

        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText;
    }
};

// Items that should NOT be encrypted
const EXCLUDED_KEYS = ['access_token', 'authToken', 'refresh_token', 'refreshToken'];

// Override ONLY sessionStorage methods
export const setupSecureStorage = () => {
    // Override sessionStorage.getItem
    sessionStorage.getItem = function (key) {
        const value = originalSessionStorage.getItem.call(this, key);

        // If no value, return null
        if (value === null || value === undefined) {
            return null;
        }

        // // Don't decrypt excluded keys
        // if (EXCLUDED_KEYS.includes(key) || !currentEncryptionKey) {
        //     return value;
        // }
        // Don't decrypt excluded keys - but still return the raw value

        if (EXCLUDED_KEYS.includes(key)) {
            return value;
        }

        // If encryption key is not set, return as is but log warning
        if (!currentEncryptionKey) {
            console.warn(`⚠️ No encryption key set when reading "${key}", returning raw value`);
            return value;
        }

        const isPlainSafeValue = (value) => {
            return ['true', 'false', 'null'].includes(value) || (!isNaN(value) && value !== '');
        };

        // If the value exists but isn't encrypted, someone manually modified it!
        // if (value && !isEncrypted(value)) {
        if (value && !isEncrypted(value) && !isPlainSafeValue(value)) {

            console.warn(`⚠️ Security Alert: Manual modification detected for key "${key}"! Value:`, value);

            // Return a garbage value that won't match any valid data
            // This will cause routing to fail (which is what we want)
            return '[INVALID_MODIFIED_DATA]';
        }

        // return value ? decrypt(value) : null;

        // Decrypt the value
        if (value && isEncrypted(value)) {
            try {
                const decrypted = decrypt(value);
                return decrypted;
            } catch (error) {
                console.error(`❌ Failed to decrypt key "${key}":`, error);
                return '[INVALID_MODIFIED_DATA]';
            }
        }

        return value;
    };

    // Override sessionStorage.setItem
    sessionStorage.setItem = function (key, value) {
        // Don't encrypt excluded keys
        if (EXCLUDED_KEYS.includes(key) || !currentEncryptionKey) {
            originalSessionStorage.setItem.call(this, key, value);
            return;
        }

        // If encryption key is not set, store as is but log warning
        if (!currentEncryptionKey) {
            console.warn(`⚠️ No encryption key set when writing "${key}", storing without encryption`);
            originalSessionStorage.setItem.call(this, key, value);
            return;
        }

        // Ensure we're always encrypting - if someone tries to set a plain value directly,
        // it will get encrypted automatically
        const encryptedValue = encrypt(value);
        originalSessionStorage.setItem.call(this, key, encryptedValue);
    };

    // Override sessionStorage.key
    sessionStorage.key = function (index) {
        return originalSessionStorage.key.call(this, index);
    };

    // Keep removeItem and clear as is
    sessionStorage.removeItem = function (key) {
        originalSessionStorage.removeItem.call(this, key);
    };

    sessionStorage.clear = function () {
        originalSessionStorage.clear.call(this);
    };

    // Add helper method to get raw encrypted value
    sessionStorage.getRawValue = function (key) {
        return originalSessionStorage.getItem.call(this, key);
    };

    // Add security check method to validate all data
    sessionStorage.validateIntegrity = function () {
        const issues = [];
        for (let i = 0; i < this.length; i++) {
            const key = this.key(i);
            if (!EXCLUDED_KEYS.includes(key) && currentEncryptionKey) {
                const rawValue = originalSessionStorage.getItem.call(this, key);
                if (rawValue && !isEncrypted(rawValue)) {
                    issues.push({ key, value: rawValue });
                }
            }
        }

        if (issues.length > 0) {
            console.error('🚨 Security integrity issues found:', issues);
        }

        return issues;
    };

    console.log('🔐 Secure session storage initialized with integrity checks');
    console.log('🔑 Encryption key present:', !!currentEncryptionKey);
};

// Run integrity check function (to be called separately)
export const runIntegrityCheck = () => {
    if (typeof sessionStorage.validateIntegrity === 'function') {
        return sessionStorage.validateIntegrity();
    } else {
        console.warn('validateIntegrity not yet available');
        return [];
    }
};

// Developer Tools - ONLY for sessionStorage
export const createEncoderDecoder = () => {
    if (process.env.NODE_ENV !== 'development') {
        console.warn('⚠️ Encoder/Decoder is only available in development mode');
        return null;
    }

    return {
        viewAll: () => {
            console.log('🔑 Current encryption key:', currentEncryptionKey ? 'Set' : 'Not set');
            const decrypted = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                decrypted[key] = sessionStorage.getItem(key);
            }
            console.log('📋 Decrypted sessionStorage:', decrypted);
            return decrypted;
        },

        viewRaw: () => {
            const raw = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                raw[key] = sessionStorage.getRawValue ? sessionStorage.getRawValue(key) :
                    originalSessionStorage.getItem.call(sessionStorage, key);
            }
            console.log('🔒 Raw encrypted sessionStorage:', raw);
            return raw;
        },

        getKey: () => currentEncryptionKey,

        // Test what happens if someone manually modifies data
        testManualModification: (key, fakeValue) => {
            console.log('🧪 Testing manual modification detection...');
            console.log(`Setting ${key} to "${fakeValue}" manually...`);

            // Simulate manual modification by using original method
            originalSessionStorage.setItem.call(sessionStorage, key, fakeValue);

            console.log('Now trying to read with getItem:');
            const result = sessionStorage.getItem(key);
            console.log('Result:', result);

            // Clean up
            sessionStorage.removeItem(key);

            return {
                attemptedValue: fakeValue,
                returnedValue: result,
                detected: result === '[INVALID_MODIFIED_DATA]'
            };
        },

        checkLocalStorage: () => {
            const ls = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                ls[key] = localStorage.getItem(key);
            }
            console.log('📦 localStorage (should be plain text):', ls);
            return ls;
        },

        // Run integrity check
        checkIntegrity: () => {
            return runIntegrityCheck();
        }
    };
};

// Initialize dev tools in development
if (process.env.NODE_ENV === 'development') {
    window.secureStorage = createEncoderDecoder();
}

export default {
    setEncryptionKey,
    clearEncryptionKey,
    getCurrentEncryptionKey,
    setupSecureStorage,
    createEncoderDecoder,
    runIntegrityCheck
};