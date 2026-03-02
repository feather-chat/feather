import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../ui';
import { authApi, ApiError } from '../../api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');

  const forgotPassword = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(email);
  };

  if (forgotPassword.isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Check your email</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            If an account exists for {email}, we sent a password reset link.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  const error =
    forgotPassword.error instanceof ApiError
      ? forgotPassword.error.message
      : forgotPassword.error
        ? 'An error occurred. Please try again.'
        : null;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          isRequired
          autoComplete="email"
        />

        <Button type="submit" className="w-full" isLoading={forgotPassword.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
