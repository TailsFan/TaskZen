import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <Card className="max-w-md w-full shadow-2xl rounded-2xl">
        <CardContent className="p-8 sm:p-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-full">
              <ClipboardCheck className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-foreground mb-3">
            TaskZen
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Ваш личный помощник по проектам
          </p>
          <p className="mb-10 max-w-sm mx-auto">
            Организуйте свои проекты, управляйте задачами и отслеживайте свой прогресс с легкостью. Оставайтесь сосредоточенными и продуктивными.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="font-bold text-lg py-6 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="font-bold text-lg py-6 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/signup">Регистрация</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TaskZen. Все права защищены.</p>
      </footer>
    </div>
  );
}
