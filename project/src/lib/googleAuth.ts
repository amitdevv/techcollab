import { GoogleLoginResponse, GoogleLoginResponseOffline } from '@react-oauth/google';
import * as authApi from '../services/authApi';

export const handleGoogleLogin = async (
  response: GoogleLoginResponse | GoogleLoginResponseOffline
) => {
  try {
    if ('tokenId' in response) {
      // This is a GoogleLoginResponse (not offline)
      const result = await authApi.loginWithGoogle(response.tokenId);
      return result;
    } else {
      throw new Error('Google login response does not contain tokenId');
    }
  } catch (error) {
    console.error('Error handling Google login:', error);
    throw error;
  }
};
