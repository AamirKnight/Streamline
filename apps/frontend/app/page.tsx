import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">StreamLine</h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Collaborate in Real-Time
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            StreamLine is a powerful collaborative document editing platform.
            Work together seamlessly with your team in real-time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">Real-Time Collaboration</h3>
              <p className="text-gray-600">
                See changes as they happen. Work together with your team in real-time.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is encrypted and secure. Role-based access control included.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">Version History</h3>
              <p className="text-gray-600">
                Never lose work. Access complete version history of all documents.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}