const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type LoginResponse = {
  access_token?: string;
  session?: {
    access_token?: string;
  };
};

type SignupResponse = {
  message?: string;
  session?: { access_token?: string } | null;
  error?: string;
};

export async function signupUser(
  displayName: string,
  email: string,
  password: string,
): Promise<{ token: string | null; message: string }> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  });

  const result = (await response.json()) as SignupResponse;
  if (!response.ok) throw new Error(result.error || 'Could not create your account.');

  return {
    token: result.session?.access_token ?? null,
    message: result.message || 'Account created. You can log in now.',
  };
}

export async function loginUser(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = (await response.json()) as LoginResponse & { error?: string };

  if (!response.ok) {
    throw new Error(result.error || 'Login failed. Check your email and password.');
  }

  const token = result.access_token || result.session?.access_token;

  if (!token) {
    throw new Error('Login succeeded, but no access token was returned.');
  }

  return token;
}

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('preppulse:session-expired'));
    }
    throw new Error(result.error || `Request failed (${response.status}).`);
  }

  return result;
}
