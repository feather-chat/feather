import { ResetPasswordForm } from '../components/auth';
import { usePageTitle } from '../hooks';

export function ResetPasswordPage() {
  usePageTitle('Reset password');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <ResetPasswordForm />
    </div>
  );
}
