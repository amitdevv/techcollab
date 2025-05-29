const GITHUB_CLIENT_ID = 'Ov23li9OAZchKLjCJwja';
const GITHUB_REDIRECT_URI = 'http://localhost:5173';

export const initiateGithubLogin = () => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
};

export const handleGithubCallback = async (code: string) => {
  try {
    // In a real application, you'd want to exchange this code for an access token
    // using a backend server to keep your client secret secure
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: 'ff4180de19629473bbc8af4371f516d08c08d18b',
        code,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      // Get user data
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      const userData = await userResponse.json();

      return {
        name: userData.name || userData.login,
        email: userData.email || `${userData.login}@github.com`,
        picture: userData.avatar_url,
      };
    }

    throw new Error('Failed to get access token');
  } catch (error) {
    console.error('GitHub auth error:', error);
    throw error;
  }
};
