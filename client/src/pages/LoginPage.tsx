import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate(from, { replace: true });
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    await register(email, password, name);
    navigate(from, { replace: true });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/f1crew.jpg')" }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col gap-6 mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Pitstop Crew</h1>
          <p className="text-gray-300">Project Timeline Management</p>
        </div>
        {isLogin ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
}
