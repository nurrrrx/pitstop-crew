import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(true);
      // In development, show the reset URL
      if (response.resetUrl) {
        setResetUrl(response.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetUrl && (
                <Alert>
                  <AlertDescription>
                    <strong>Development mode:</strong> Click the link below to reset your password:
                    <br />
                    <a href={resetUrl} className="text-blue-600 hover:underline break-all">
                      {resetUrl}
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link to="/login">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

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
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
