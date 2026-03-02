import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../ui';
import { authApi, ApiError } from '../../api';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const resetPassword = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!token) return;

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    resetPassword.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invalid reset link</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Password reset</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your password has been reset successfully.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in with your new password
          </Link>
        </p>
      </div>
    );
  }

  const apiError =
    resetPassword.error instanceof ApiError
      ? resetPassword.error.message
      : resetPassword.error
        ? 'An error occurred. Please try again.'
        : null;
  const error = validationError || apiError;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset password</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          type="password"
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          isRequired
          autoComplete="new-password"
        />

        <Input
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          isRequired
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" isLoading={resetPassword.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
