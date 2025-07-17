'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

const AuthGuard = ({ children }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/'); // redirige si no hay token
    } else {
      setLoading(false); // permitir renderizado si hay token
    }
  }, [router]);

  if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-black/50">
      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}; // Evita parpadeo al cargar

  return <>{children}</>;
};

export default AuthGuard;
