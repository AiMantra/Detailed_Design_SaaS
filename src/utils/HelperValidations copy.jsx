
// Common Input Restriction Functions

const inputMinLimit = (name = 'Value', value, minValue) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue >= minValue) {
        return { success: true, error: "" };
    }

    return { success: false, error: `${name || 'Value'} must be at least ${minValue}` };
};

const inputMaxLimit = (name = 'Value', value, maxValue) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue <= maxValue) {
        return { success: true, error: "" };
    }

    return { success: false, error: `${name || 'Value'} must be at most ${maxValue}` };
};


// Common Validation Functions

const validateName = (name) => {
    if (!name) return false;
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s\-']+$/;
    return nameRegex.test(name) && name.length <= 50;
};

const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
};

const validatePhoneNumber = (phone) => {
    if (!phone && phone !== 0) return false;

    // Convert to string if it's a number
    const phoneStr = String(phone);

    // Remove any non-digit characters
    const cleanPhone = phoneStr.replace(/\D/g, '');

    // Check if it's exactly 10 digits and starts with 6-9 (Indian mobile number validation)
    const phoneRegex = /^[6-9][0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
};

const validatePinCode = (pincode) => {
    if (!pincode) return false;
    const pincodeStr = String(pincode).replace(/\s/g, '');
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincodeStr);
};

const validateDOB = (dob) => {
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

const validateMarriageDate = (marriageDate, maritalStatus, dob) => {

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


// Validation helper functions
const validateAadhaar = (aadhaar) => {
    if (!aadhaar) return false;

    // Convert to string if it's a number
    const aadhaarStr = String(aadhaar);

    // Remove spaces and hyphens for validation
    const cleanAadhaar = aadhaarStr.replace(/[\s-]/g, '');

    // Check if it's exactly 12 digits and doesn't start with 0 or 1
    const aadhaarRegex = /^[2-9][0-9]{11}$/;
    return aadhaarRegex.test(cleanAadhaar);
};

const validatePAN = (pan) => {
    if (!pan) return false;

    // Convert to string if it's a number
    const panStr = String(pan);

    // Remove spaces and convert to uppercase
    const cleanPan = panStr.replace(/\s/g, '').toUpperCase();

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

// const validateGST = (gst) => {
//     if (!gst) return false;

//     const gstStr = String(gst).replace(/\s/g, '').toUpperCase();
//     const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

//     return gstRegex.test(gstStr);
// };

const validateGST = (gst) => {
    if (!gst) return false;

    const gstStr = String(gst).replace(/\s/g, '').toUpperCase();
    // Accept both 14 and 15 character GST
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{0,1}$/;

    return gstRegex.test(gstStr);
};

const validateIFSC = (ifsc) => {
    if (!ifsc) return false;
    const ifscStr = String(ifsc).toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscStr);
};

const validateUAN = (uan) => {
    if (!uan) return true; // Not required, so return true if empty

    // Convert to string if it's a number
    const uanStr = String(uan);

    // UAN should be 12 digits
    const cleanUan = uanStr?.replace(/\D/g, '');
    const uanRegex = /^[0-9]{12}$/;
    return uanRegex.test(cleanUan);
};

const validateESI = (esi) => {
    if (!esi) return true; // Not required, so return true if empty

    // Convert to string if it's a number
    const esiStr = String(esi);

    // ESI format: XX-XXXXXXXXX-XXX (2 digits - 9 digits - 3 digits)
    const cleanEsi = esiStr?.replace(/[\s-]/g, '');
    const digitRegex = /^[0-9]{14}$/; // 14 digits total
    if (!digitRegex.test(cleanEsi)) return false;
    return digitRegex.test(cleanEsi);
};


// Generic helper to extract allowed characters from a validation regex
const getAllowedCharsRegex = (validationFn) => {
    // This is a helper to explain the concept
    // For actual implementation, we extract from the regex pattern
    return validationFn;
};


// Input restriction helpers (add to your validation file)

export const restrictToNumbers = (value) => {
    return value.replace(/\D/g, '');
};

export const restrictToDigits = (value, maxLength) => {
    const numbers = value.replace(/\D/g, '');
    return maxLength ? numbers.slice(0, maxLength) : numbers;
};

export const restrictToAlphanumeric = (value) => {
    return value.replace(/[^A-Za-z0-9]/g, '');
};

export const restrictToLetters = (value) => {
    return value.replace(/[^A-Za-z\s\-']/g, '');
};

export const restrictToUppercase = (value) => {
    return value.toUpperCase();
};

export const restrictGST = (value) => {
    // GST: Only alphanumeric, uppercase, max 15 chars
    let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 15);
};

export const restrictPAN = (value) => {
    // PAN: Only alphanumeric, uppercase, max 10 chars
    let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 10);
};

export const restrictAadhaar = (value) => {
    // Aadhaar: Only numbers, max 12 digits, can add spaces every 4 digits
    const numbers = value.replace(/\D/g, '');
    const truncated = numbers.slice(0, 12);
    // Optional: Add spaces for better UX
    return truncated.replace(/(\d{4})/g, '$1 ').trim();
};

export {

    // For Input Restrictions 
    inputMinLimit,
    inputMaxLimit,

    // For Submit Validations
    validateName,
    validateEmail,
    validatePhoneNumber,
    validatePinCode,
    validateDOB,
    validateMarriageDate,

    validateAadhaar,
    validatePAN,
    validateGST,
    validateIFSC,
    validateUAN,
    validateESI,

}