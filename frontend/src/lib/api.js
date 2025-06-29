// API utility functions for Quint RAG backend

const API_BASE_URL = 'http://127.0.0.1:8000';

// Health check
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

// Query documents
export const queryDocuments = async (question, maxResults = 5) => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        max_results: maxResults
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
};

// Index a folder
export const indexFolder = async (folderPath) => {
  try {
    const response = await fetch(`${API_BASE_URL}/index/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folder_path: folderPath
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Index folder failed:', error);
    throw error;
  }
};

// Watch a folder for real-time changes
export const watchFolder = async (folderPath) => {
  try {
    console.log('Making watchFolder API call with path:', folderPath);
    const response = await fetch(`${API_BASE_URL}/watch/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folder_path: folderPath
      }),
    });

    console.log('Watch folder response status:', response.status);
    console.log('Watch folder response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Watch folder error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Watch folder success result:', result);
    return result;
  } catch (error) {
    console.error('Watch folder failed:', error);
    throw error;
  }
};

// Stop watching a folder
export const stopWatchingFolder = async (folderPath) => {
  try {
    const response = await fetch(`${API_BASE_URL}/watch/folder/${encodeURIComponent(folderPath)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Stop watching folder failed:', error);
    throw error;
  }
};

// List watched folders
export const listWatchedFolders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/watch/folders`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('List watched folders failed:', error);
    throw error;
  }
};

// List all documents
export const listDocuments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('List documents failed:', error);
    throw error;
  }
};

// Get statistics
export const getStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get stats failed:', error);
    throw error;
  }
};

// Search documents
export const searchDocuments = async (query, limit = 5) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

// Reset index
export const resetIndex = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Reset index failed:', error);
    throw error;
  }
}; 