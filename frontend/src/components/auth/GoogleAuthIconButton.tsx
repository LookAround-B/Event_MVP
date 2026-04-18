import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';

type GoogleAuthIconButtonProps = {
  disabled?: boolean;
  onToken: (token: string) => void | Promise<void>;
  onError: (message: string) => void;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.43c-.23 1.25-.94 2.32-2 3.03l3.23 2.5c1.88-1.73 2.97-4.27 2.97-7.3 0-.71-.06-1.39-.18-2.04H12Z"
      />
      <path
        fill="#4285F4"
        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.23-2.5c-.9.61-2.04.97-3.38.97-2.6 0-4.8-1.75-5.58-4.11H3.09v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.42 13.92A5.99 5.99 0 0 1 6.11 12c0-.67.11-1.31.31-1.92V7.5H3.09A9.99 9.99 0 0 0 2 12c0 1.61.39 3.14 1.09 4.5l3.33-2.58Z"
      />
      <path
        fill="#34A853"
        d="M12 5.97c1.47 0 2.78.51 3.82 1.5l2.86-2.86C16.95 2.99 14.69 2 12 2 8.09 2 4.72 4.24 3.09 7.5l3.33 2.58C7.2 7.72 9.4 5.97 12 5.97Z"
      />
    </svg>
  );
}

function GoogleAuthIconButtonInner({ disabled, onToken, onError }: GoogleAuthIconButtonProps) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: (tokenResponse) => {
      if (!tokenResponse.access_token) {
        onError('Google login failed. Please try again.');
        return;
      }
      void onToken(tokenResponse.access_token);
    },
    onError: () => onError('Google login failed. Please try again.'),
    onNonOAuthError: () => onError('Google login failed. Please try again.'),
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={() => login()}
      className="h-12 w-12 rounded-full border border-white/20 bg-white text-black shadow-[0_12px_36px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.03] hover:bg-white"
      aria-label="Continue with Google"
    >
      <GoogleMark />
    </Button>
  );
}

export default function GoogleAuthIconButton(props: GoogleAuthIconButtonProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;
  return <GoogleAuthIconButtonInner {...props} />;
}
