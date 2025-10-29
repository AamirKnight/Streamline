import { toast } from 'sonner';

export const handleApiError = (error: any) => {
  console.error('API Error:', error);

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.message;

    switch (status) {
      case 400:
        toast.error('Invalid request: ' + message);
        break;
      case 401:
        toast.error('Please login to continue');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You dont have permission to do that');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message || 'Something went wrong');
    }
  } else if (error.request) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error('An unexpected error occurred');
  }
};