// ============================================
// CENTRALIZED CLEANING UTILITIES
// ============================================

const CleaningUtils = {
    // Remove all non-alphanumeric and convert to uppercase
    alphanumericUppercase: (value) => String(value).replace(/[^A-Za-z0-9]/g, '').toUpperCase(),

    // Remove spaces only and convert to uppercase
    uppercaseNoSpaces: (value) => String(value).replace(/\s/g, '').toUpperCase(),

    // Remove all non-digits
    onlyDigits: (value) => String(value).replace(/\D/g, ''),

    // Remove spaces and hyphens
    noSpacesOrHyphens: (value) => String(value).replace(/[\s-]/g, ''),

    // Keep only letters, spaces, hyphens, apostrophes
    nameCharacters: (value) => String(value).replace(/[^A-Za-z\s\-']/g, ''),

    // Keep only alphanumeric (no case conversion)
    alphanumeric: (value) => String(value).replace(/[^A-Za-z0-9]/g, ''),

    // Keep only letters
    letters: (value) => String(value).replace(/[^A-Za-z\s\-']/g, '')
};

// ============================================
// COMMON INPUT RESTRICTION FUNCTIONS
// ============================================

export const inputMinLimit = (name = 'Value', value, minValue) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue >= minValue) {
        return { success: true, error: "" };
    }

    return { success: false, error: `${name || 'Value'} must be at least ${minValue}` };
};

export const inputMaxLimit = (name = 'Value', value, maxValue) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue <= maxValue) {
        return { success: true, error: "" };
    }

    return { success: false, error: `${name || 'Value'} must be at most ${maxValue}` };
};

// ============================================
// COMMON VALIDATION FUNCTIONS
// ============================================

export const validateName = (name) => {
    if (!name) return false;
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s\-']+$/;
    return nameRegex.test(name) && name.length <= 50;
};

export const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
};

export const validatePhoneNumber = (phone) => {
    if (!phone && phone !== 0) return false;

    // Convert to string if it's a number
    const phoneStr = String(phone);

    // Remove any non-digit characters using cleaning utility
    const cleanPhone = CleaningUtils.onlyDigits(phoneStr);

    // Check if it's exactly 10 digits and starts with 6-9 (Indian mobile number validation)
    const phoneRegex = /^[6-9][0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
};

export const validatePinCode = (pincode) => {
    if (!pincode) return false;
    const pincodeStr = String(pincode).replace(/\s/g, '');
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincodeStr);
};

export const validateDOB = (dob) => {
    if (!dob) return false;

    const selectedDate = new Date(dob);
    const currentDate = new Date();

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) return false;

    // Check if date is in the future
    if (selectedDate > currentDate) return false;

    // Optional: Check if person is at least 15 years old (for employment)
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
    if (selectedDate > minAgeDate) {
        // This is just a warning, not a hard validation - you can decide if you want to block
        return true; // Still return true for valid format, but you can show a warning
    }

    return true;
};

export const validateMarriageDate = (marriageDate, maritalStatus, dob) => {

    if (maritalStatus !== 'married') return true;
    if (!marriageDate) return false;

    const selectedDate = new Date(marriageDate);
    const currentDate = new Date();
    const dobDate = new Date(dob);

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) return false;

    // Check if date is in the future
    if (selectedDate > currentDate) return false;

    // Check if marriage date is after DOB
    if (dob && selectedDate < dobDate) return false;

    return true;
};

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

export const validateAadhaar = (aadhaar) => {
    if (!aadhaar) return false;

    // Remove spaces and hyphens for validation using cleaning utility
    const cleanAadhaar = CleaningUtils.noSpacesOrHyphens(aadhaar);

    // Check if it's exactly 12 digits and doesn't start with 0 or 1
    const aadhaarRegex = /^[2-9][0-9]{11}$/;
    return aadhaarRegex.test(cleanAadhaar);
};

export const validatePAN = (pan) => {
    if (!pan) return false;

    // Remove spaces and convert to uppercase using cleaning utility
    const cleanPan = CleaningUtils.uppercaseNoSpaces(pan);

    // More specific PAN format with 4th character validation (P,C,H,F,A,T,B,L,J,G)
    // [A-Z]{3} - First three letters
    // [PCHFATBLJG]{1} - Fourth character (entity type)
    // [A-Z]{1} - Fifth character (first letter of surname/name)
    // [0-9]{4} - Four digits
    // [A-Z]{1} - Last character
    // const panRegex = /^[A-Z]{3}[PCHFATBLJG]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // for easy entry        

    return panRegex.test(cleanPan);
};

export const validateGST = (gst) => {
    if (!gst) return false;

    // Clean using alphanumeric uppercase utility
    const gstStr = CleaningUtils.alphanumericUppercase(gst);
    // Accept both 14 and 15 character GST
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{0,1}$/;

    return gstRegex.test(gstStr);
};

export const validateIFSC = (ifsc) => {
    if (!ifsc) return false;
    const ifscStr = String(ifsc).toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscStr);
};

export const validateUAN = (uan) => {
    if (!uan) return true; // Not required, so return true if empty

    // UAN should be 12 digits using cleaning utility
    const cleanUan = CleaningUtils.onlyDigits(uan);
    const uanRegex = /^[0-9]{12}$/;
    return uanRegex.test(cleanUan);
};

export const validateESI = (esi) => {
    if (!esi) return true; // Not required, so return true if empty

    // ESI format: XX-XXXXXXXXX-XXX (2 digits - 9 digits - 3 digits)
    const cleanEsi = CleaningUtils.noSpacesOrHyphens(esi);
    const digitRegex = /^[0-9]{14}$/; // 14 digits total
    return digitRegex.test(cleanEsi);
};

// ============================================
// INPUT RESTRICTION HELPERS (REUSING CLEANING UTILITIES)
// ============================================

export const restrictToNumbers = (value) => {
    if (!value) return '';
    return CleaningUtils.onlyDigits(value);
};

export const restrictToDigits = (value, maxLength) => {
    if (!value) return '';
    const numbers = CleaningUtils.onlyDigits(value);
    return maxLength ? numbers.slice(0, maxLength) : numbers;
};

export const restrictToAlphanumeric = (value) => {
    if (!value) return '';
    return CleaningUtils.alphanumeric(value);
};

export const restrictToLetters = (value) => {
    if (!value) return '';
    return CleaningUtils.nameCharacters(value);
};

export const restrictToUppercase = (value) => {
    if (!value) return '';
    return value.toUpperCase();
};

// Reusing validation cleaning logic for restrictions
export const restrictGST = (value) => {
    if (!value) return '';
    // Reuse the same cleaning logic as validateGST
    let cleaned = CleaningUtils.alphanumericUppercase(value);
    return cleaned.slice(0, 15);
};

export const restrictPAN = (value) => {
    if (!value) return '';
    // Reuse the same cleaning logic as validatePAN
    let cleaned = CleaningUtils.uppercaseNoSpaces(value);
    return cleaned.slice(0, 10);
};

export const restrictAadhaar = (value) => {
    if (!value) return '';
    // Reuse the same cleaning logic as validateAadhaar
    const numbers = CleaningUtils.noSpacesOrHyphens(value);
    const truncated = numbers.slice(0, 12);
    // Optional: Add spaces for better UX
    return truncated.replace(/(\d{4})/g, '$1 ').trim();
};

// Additional restriction helpers that reuse validation patterns
export const restrictIFSC = (value) => {
    if (!value) return '';
    // IFSC: uppercase alphanumeric, max 11 chars
    let cleaned = CleaningUtils.alphanumericUppercase(value);
    return cleaned.slice(0, 11);
};

export const restrictUAN = (value) => {
    if (!value) return '';
    // UAN: only digits, max 12 chars
    let cleaned = CleaningUtils.onlyDigits(value);
    return cleaned.slice(0, 12);
};

export const restrictESI = (value) => {
    if (!value) return '';
    // ESI: only digits, max 14 chars
    let cleaned = CleaningUtils.onlyDigits(value);
    return cleaned.slice(0, 14);
};

export const restrictPhoneNumber = (value) => {
    if (!value) return '';
    // Phone: only digits, max 10 chars
    let cleaned = CleaningUtils.onlyDigits(value);
    return cleaned.slice(0, 10);
};

export const restrictPinCode = (value) => {
    if (!value) return '';
    // Pincode: only digits, max 6 chars
    let cleaned = CleaningUtils.onlyDigits(value);
    return cleaned.slice(0, 6);
};

// ============================================
// EXPORTS
// ============================================

// export {
//     // For Input Restrictions
//     inputMinLimit,
//     inputMaxLimit,

//     // For Submit Validations
//     validateName,
//     validateEmail,
//     validatePhoneNumber,
//     validatePinCode,
//     validateDOB,
//     validateMarriageDate,
//     validateAadhaar,
//     validatePAN,
//     validateGST,
//     validateIFSC,
//     validateUAN,
//     validateESI,
// };