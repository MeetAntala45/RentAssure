import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function GoogleLoginButton() {
  const { googleLogin } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
    } catch {
      // Error is handled by the login page
    }
  };

  return (
    <div className="google-login-wrapper" id="google-login-btn">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.error('Google login failed');
        }}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
