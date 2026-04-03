/**
 * Toast notification helper to automatically set variant based on success/error
 */

import { type ToastProps } from '@/components/ui/toast';

export type ToastOptions = Omit<ToastProps, 'variant'> & {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
};

/**
 * Show a success toast notification
 */
export const showSuccessToast = (toast: any, message: string, description?: string) => {
  toast({
    title: message,
    description,
    variant: 'success',
  });
};

/**
 * Show an error/destructive toast notification
 */
export const showErrorToast = (toast: any, message: string, description?: string) => {
  toast({
    title: message,
    description,
    variant: 'destructive',
  });
};

/**
 * Show a default toast notification
 */
export const showInfoToast = (toast: any, message: string, description?: string) => {
  toast({
    title: message,
    description,
    variant: 'default',
  });
};

/**
 * Handle API error and show toast
 */
export const handleAPIError = (toast: any, error: any) => {
  const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong';
  showErrorToast(toast, 'Error', errorMessage);
};

/**
 * Handle API success and show toast
 */
export const handleAPISuccess = (toast: any, message: string = 'Success', description?: string) => {
  showSuccessToast(toast, message, description);
};
