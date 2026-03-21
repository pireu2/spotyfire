import { useState, useEffect } from 'react';
import { useUser } from '@stackframe/stack';

export function useAuth() {
  const user = useUser();
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const getToken = async () => {
      try {
        const auth = await user.getAuthJson();
        const token = auth?.accessToken;
        setAccessToken(token || undefined);
      } catch (error) {
        console.error('Failed to get access token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [user?.id]);

  return {
    user,
    userId: user?.id,
    accessToken,
    isLoading,
  };
}
