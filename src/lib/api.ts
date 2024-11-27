import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  // Store the token in localStorage
  localStorage.setItem('token', data.token);
  return data;
}

export async function logout() {
  try {
    const token = getAuthToken();
    if (token) {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Optionally notify the server about the logout
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore server errors during logout
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export async function fetchInsights(token: string) {
  const response = await fetch(`${API_URL}/api/insights`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch insights');
  }

  return response.json();
}

export async function getStudentByCard(cardId: string, token: string) {
  const response = await fetch(`${API_URL}/api/students/card/${cardId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch student data');
  }

  return response.json();
}

export async function addCredit(
  studentId: string,
  amount: number,
  type: 'balance' | 'subscription',
  token: string,
  subscriptionType?: 'TERM' | 'ANNUAL'
) {
  const response = await fetch(`${API_URL}/api/students/${studentId}/credit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      type,
      subscriptionType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add credit');
  }

  return response.json();
}

export async function processTransaction(studentId: string, items: Array<{ productId: string; quantity: number }>, token: string) {
  const response = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studentId,
      items,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process transaction');
  }

  return response.json();
}

export async function getProducts(token: string) {
  const response = await fetch(`${API_URL}/api/products`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }

  return response.json();
}

export async function getTransactionHistory(token: string) {
  const response = await fetch(`${API_URL}/api/transactions/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transaction history');
  }

  return response.json();
}

export async function createStudent(data: {
  cardId: string;
  name: string;
  grade: string;
  externalCode: string;
  email: string;
}, token: string) {
  const response = await fetch(`${API_URL}/api/students`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create student');
  }

  return response.json();
}

export async function checkout(requestData: {
  cardId: string;
  total: number;
  items: { id: string; quantity: number; price: number }[];
}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  
  try {
    const response = await fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(errorData.error || 'Checkout failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

export const updateStudentPhoto = async (externalCode: string, photoUrl: string, token: string) => {
  // Validate input
  if (!externalCode || !photoUrl) {
    throw new Error('Invalid data');
  }

  try {
    // Send a PUT request to your backend API to update the student photo
    const response = await fetch(`${API_URL}/api/students/${externalCode}/photo`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoUrl, // Send the new photo URL in the request body
      }),
    });

    // If the response is not OK, throw an error
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update student photo');
    }

    // Return the updated student data
    return response.json();
  } catch (error) {
    throw new Error('Failed to update student photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

