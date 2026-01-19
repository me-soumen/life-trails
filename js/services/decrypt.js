// ============================================================================
// CREDENTIAL DECRYPT - Decryption Library
// ============================================================================
export async function decryptToken(encryptedString, password) {
	if (!password || !encryptedString) {
		throw new Error('Password and encrypted string are required');
	}

	// Decode base64
	const combined = base64ToArrayBuffer(encryptedString);
	const combinedArray = new Uint8Array(combined);

	// Extract salt, IV, and encrypted data
	const salt = combinedArray.slice(0, 16);
	const iv = combinedArray.slice(16, 28);
	const encrypted = combinedArray.slice(28);

	// Derive key from password
	const key = await deriveKey(password, salt);

	// Decrypt
	const decrypted = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		encrypted
	);

	// Convert to string
	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}

// ============================================================================
// HELPER FUNCTIONS - Used by decryption function
// ============================================================================
async function deriveKey(password, salt) {
	const encoder = new TextEncoder();
	const passwordKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits', 'deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 600000, // OWASP recommended minimum
			hash: 'SHA-256'
		},
		passwordKey,
		{
			name: 'AES-GCM',
			length: 256
		},
		false,
		['encrypt', 'decrypt']
	);
}

function base64ToArrayBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}
