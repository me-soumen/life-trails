import { decryptToken } from './decrypt.js';

/*------------------------------------------------------------------------------------------------
GitHub APIs: Fetch Content / Upload a File / Update a File / Delete a File
----------------------------------------------------------------------------------------------*/

// Get config from localStorage or fetch from file
async function getConfig() {
	const configFromStorage = localStorage.getItem('appConfig');
	if (configFromStorage) {
		return JSON.parse(configFromStorage);
	}
	
	// Fallback: Try to load from config file (use root-relative path)
	try {
		const configPath = '/js/config/config.json';
		const response = await fetch(configPath);
		if (!response.ok) {
			throw new Error('Failed to load config.json');
		}
		const config = await response.json();
		// Cache it in localStorage for future use
		localStorage.setItem('appConfig', JSON.stringify(config));
		return config;
	} catch (error) {
		throw new Error('Config not loaded. Please ensure config.json is accessible.');
	}
}

// Get decrypted token for a user
// First tries to get from sessionStorage (if already decrypted during sign-in)
// Falls back to decrypting with password if not found
async function getDecryptedToken(username, password) {
	// Try to get from sessionStorage first (more secure, no password needed)
	const PAT_STORAGE_KEY = `life-trails-pat-${username}`;
	const storedToken = sessionStorage.getItem(PAT_STORAGE_KEY);
	if (storedToken) {
		return storedToken;
	}
	
	// Fallback: decrypt with password if not in sessionStorage
	// This handles cases where sessionStorage was cleared but user is still logged in
	if (!password) {
		throw new Error('Password required for token decryption');
	}
	
	const config = await getConfig();
	if (!config.encryptedSecrets || !config.encryptedSecrets[username]) {
		throw new Error(`Encrypted secret not found for user: ${username}`);
	}
	
	const encryptedSecret = config.encryptedSecrets[username];
	const token = await decryptToken(encryptedSecret, password);
	
	// Store in sessionStorage for future use
	sessionStorage.setItem(PAT_STORAGE_KEY, token);
	return token;
}

// Helper: Convert string to base64
function stringToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

// Helper: Convert base64 to string
function base64ToString(base64) {
	return decodeURIComponent(escape(atob(base64)));
}

// Fetch user data from GitHub
export async function fetchUserData(username, password, userId) {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Construct file path: life-trails/{userId}/data.json
	// userId should be the username (e.g., lt_john) which matches the folder name
	const filePath = `${config.dataFolderPath}/${userId}/data.json`;
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const response = await fetch(fileUrl, {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (!response.ok) {
		const error = await response.json();
		if (response.status === 404) {
			// File doesn't exist yet - return null (new user)
			return null;
		}
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const data = await response.json();
	
	// Decode base64 content to JSON
	if (data.content && data.encoding === 'base64') {
		const jsonContent = base64ToString(data.content);
		return {
			content: JSON.parse(jsonContent),
			sha: data.sha,
			path: data.path
		};
	}
	
	throw new Error('Invalid file format from GitHub');
}

// Upload or update user data to GitHub
export async function saveUserData(username, password, userId, userData, existingSha = null) {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Convert JSON to base64
	const jsonString = JSON.stringify(userData, null, 2);
	const base64Content = stringToBase64(jsonString);
	
	// Construct file path: life-trails/{userId}/data.json
	const filePath = `${config.dataFolderPath}/${userId}/data.json`;
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const commitMessage = existingSha 
		? config.commit.message.modify 
		: config.commit.message.add;
	
	const body = {
		message: commitMessage,
		committer: {
			name: config.commit.committerName,
			email: config.commit.committerEmail
		},
		content: base64Content
	};
	
	// If updating existing file, include SHA
	if (existingSha) {
		body.sha = existingSha;
	}

	const response = await fetch(fileUrl, {
		method: 'PUT',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const data = await response.json();
	return {
		sha: data.content.sha,
		path: data.content.path,
		url: data.content.html_url
	};
}

// Upload image to GitHub
export async function uploadImage(username, password, userId, imageName, imageContent, imageType = 'event') {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Determine image folder based on type
	const imageFolder = imageType === 'event' 
		? config.eventsImagesFolderPath 
		: config.familyImagesFolderPath;
	
	// Construct file path: life-trails/{userId}/images/{type}/{imageName}
	const filePath = `${config.dataFolderPath}/${userId}/${imageFolder}/${imageName}`;
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	// imageContent should already be base64 encoded
	const body = {
		message: config.commit.message.add,
		committer: {
			name: config.commit.committerName,
			email: config.commit.committerEmail
		},
		content: imageContent // base64 encoded image
	};

	const response = await fetch(fileUrl, {
		method: 'PUT',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const data = await response.json();
	return {
		sha: data.content.sha,
		path: data.content.path,
		url: data.content.html_url,
		downloadUrl: data.content.download_url
	};
}

// Update existing image in GitHub
export async function updateImage(username, password, userId, imageName, imageContent, imageSha, imageType = 'event') {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Determine image folder based on type
	const imageFolder = imageType === 'event' 
		? config.eventsImagesFolderPath 
		: config.familyImagesFolderPath;
	
	// Construct file path: life-trails/{userId}/images/{type}/{imageName}
	const filePath = `${config.dataFolderPath}/${userId}/${imageFolder}/${imageName}`;
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const body = {
		message: config.commit.message.modify,
		committer: {
			name: config.commit.committerName,
			email: config.commit.committerEmail
		},
		sha: imageSha,
		content: imageContent // base64 encoded image
	};

	const response = await fetch(fileUrl, {
		method: 'PUT',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const data = await response.json();
	return {
		sha: data.content.sha,
		path: data.content.path,
		url: data.content.html_url,
		downloadUrl: data.content.download_url
	};
}

// Delete a file from GitHub
export async function deleteFile(username, password, filePath, fileSha) {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const body = {
		message: config.commit.message.delete,
		committer: {
			name: config.commit.committerName,
			email: config.commit.committerEmail
		},
		sha: fileSha
	};

	const response = await fetch(fileUrl, {
		method: 'DELETE',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	return { success: true };
}

// Fetch image from GitHub
export async function fetchImage(username, password, userId, imageName, imageType = 'event') {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Determine image folder based on type
	const imageFolder = imageType === 'event' 
		? config.eventsImagesFolderPath 
		: config.familyImagesFolderPath;
	
	// Construct file path: life-trails/{userId}/images/{type}/{imageName}
	const filePath = `${config.dataFolderPath}/${userId}/${imageFolder}/${imageName}`;
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const response = await fetch(fileUrl, {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (!response.ok) {
		if (response.status === 404) {
			return null; // Image doesn't exist
		}
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const data = await response.json();
	
	// Return download URL (GitHub provides this)
	if (data.download_url) {
		return data.download_url;
	}
	
	// If download_url not available, decode base64 content
	if (data.content && data.encoding === 'base64') {
		return `data:image/png;base64,${data.content}`;
	}
	
	throw new Error('Invalid image format from GitHub');
}

// Fetch directory contents from GitHub (returns array of all files in folder)
export async function fetchDirectoryContents(username, password, userId, folderPath) {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Construct directory path: life-trails/{userId}/{folderPath}
	const dirPath = `${config.dataFolderPath}/${userId}/${folderPath}`;
	const dirUrl = `${config.baseUrl}/${dirPath}`;
	
	const response = await fetch(dirUrl, {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (response.status === 404) {
		return []; // Directory doesn't exist, return empty array
	}

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	const contents = await response.json();
	
	// Filter for files only (not subdirectories)
	return contents.filter(item => item.type === 'file');
}

// Fetch all images from a directory and return as a map { filename: dataUrl }
export async function fetchAllImagesFromDirectory(username, password, userId, imageType = 'event') {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	// Determine image folder based on type
	const imageFolder = imageType === 'event' 
		? config.eventsImagesFolderPath 
		: config.familyImagesFolderPath;
	
	try {
		// Fetch all files in the directory
		const files = await fetchDirectoryContents(username, password, userId, imageFolder);
		
		// Process all files in parallel
		const imagePromises = files.map(async (file) => {
			try {
				// Use download_url if available (faster)
				if (file.download_url) {
					const response = await fetch(file.download_url);
					const blob = await response.blob();
					
					return new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => {
							resolve({
								name: file.name,
								dataUrl: reader.result,
								size: file.size
							});
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					});
				} else if (file.content && file.encoding === 'base64') {
					// Use base64 content directly
					const mimeType = file.name.endsWith('.png') ? 'image/png' : 
									 file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') ? 'image/jpeg' :
									 file.name.endsWith('.gif') ? 'image/gif' : 'image/png';
					return {
						name: file.name,
						dataUrl: `data:${mimeType};base64,${file.content}`,
						size: file.size
					};
				}
			} catch (error) {
				console.warn(`⚠️ Failed to process image ${file.name}:`, error.message);
				return null;
			}
		});
		
		const results = await Promise.allSettled(imagePromises);
		
		// Convert to map { filename: dataUrl }
		const imageMap = {};
		results.forEach((result, index) => {
			if (result.status === 'fulfilled' && result.value) {
				imageMap[result.value.name] = result.value.dataUrl;
			}
		});
		
		return imageMap;
	} catch (error) {
		console.warn(`⚠️ Failed to fetch directory ${imageFolder}:`, error.message);
		return {}; // Return empty map on error
	}
}

// Check if file exists in GitHub
export async function fileExists(username, password, filePath) {
	const token = await getDecryptedToken(username, password);
	const config = await getConfig();
	
	const fileUrl = `${config.baseUrl}/${filePath}`;
	
	const response = await fetch(fileUrl, {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	if (response.status === 404) {
		return false;
	}

	if (!response.ok) {
		const error = await response.json();
		throw new Error(`GitHub API error: ${error.message}`);
	}

	return true;
}
