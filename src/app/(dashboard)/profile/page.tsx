
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/page-header';
import ThemeSwitcher from '@/components/theme-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, useFirestore, useStorage } from '@/firebase';
import { LogOut, User as UserIcon, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { doc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import ReactCrop, { type Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  email: z.string().email({ message: 'Неверный формат электронной почты.' }),
});

// Helper to get cropped image data
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Failed to get canvas context'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg'));
    });
}

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();

  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropping state
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      name: user?.displayName || '',
      email: user?.email || '',
    },
  });

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleUpdateProfile = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user || !firestore || !auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: values.name });
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, { name: values.name }, { merge: true });

      toast({
        title: 'Профиль обновлен',
        description: 'Ваш профиль был успешно обновлен.',
      });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Ошибка обновления',
            description: error.message || 'Произошла неизвестная ошибка.',
        });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email || !deletePassword) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      toast({
        title: 'Аккаунт удален',
        description: 'Ваш аккаунт был навсегда удален.',
      });
      router.push('/signup');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка удаления',
        description: error.code === 'auth/wrong-password' ? 'Неверный пароль. Пожалуйста, попробуйте еще раз.' : error.message,
      });
      setDeletePassword('');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };
  
  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current || !user || !storage || !firestore || !auth.currentUser) {
        return;
    }

    setIsUploading(true);
    setIsCropModalOpen(false);

    try {
        const croppedImageDataUrl = await getCroppedImg(imgRef.current, completedCrop);
        
        const avatarRef = storageRef(storage, `avatars/${user.uid}/profile.jpg`);
        const snapshot = await uploadString(avatarRef, croppedImageDataUrl, 'data_url');
        const photoURL = await getDownloadURL(snapshot.ref);

        await updateProfile(auth.currentUser, { photoURL });

        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { profilePicture: photoURL }, { merge: true });

        toast({
            title: 'Аватар обновлен',
            description: 'Ваш аватар был успешно обновлен.',
        });
        
        await auth.currentUser.reload();
        router.refresh();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Ошибка загрузки аватара',
            description: error.message || 'Произошла неизвестная ошибка.',
        });
    } finally {
        setIsUploading(false);
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="pb-20">
      <PageHeader title="Профиль" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
             <div className="relative">
                <Avatar className="w-16 h-16 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={user?.photoURL || undefined} alt="Аватар пользователя" className="object-cover" />
                    <AvatarFallback>
                        {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UserIcon className="w-8 h-8" />}
                    </AvatarFallback>
                </Avatar>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onSelectFile}
                    className="hidden"
                    accept="image/png, image/jpeg"
                    disabled={isUploading}
                />
                 {isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                )}
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline">{user?.displayName || 'Пользователь'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Информация об аккаунте</CardTitle>
                <CardDescription>Обновите данные своего аккаунта.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Имя</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Электронная почта</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Сохранить изменения</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Настройки и безопасность</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <div>
                <Label htmlFor="theme-switch" className="font-medium">Темная тема</Label>
                <p className="text-sm text-muted-foreground">Включить или выключить темный режим.</p>
              </div>
              <ThemeSwitcher />
            </div>

            <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
                <AlertDialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 sm:p-6 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-muted-foreground" />
                            <Label className="font-medium cursor-pointer">Выйти</Label>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены, что хотите выйти?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы будете перенаправлены на страницу входа.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Выйти</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogTrigger asChild>
                     <div className="flex items-center justify-between p-4 sm:p-6 cursor-pointer text-destructive">
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5" />
                            <Label className="font-medium cursor-pointer text-destructive">Удалить аккаунт</Label>
                        </div>
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие необратимо. Это навсегда удалит ваш аккаунт и удалит ваши данные с наших серверов.
                            Пожалуйста, введите свой пароль для подтверждения.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                         <Label htmlFor="delete-password">Пароль</Label>
                         <Input 
                            id="delete-password"
                            type="password" 
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Введите ваш пароль"
                         />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletePassword('')}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={!deletePassword}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          </CardContent>
        </Card>

      </div>

        <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Обрезать изображение</DialogTitle>
                    <DialogDescriptionComponent>
                        Настройте область, которая будет видна на вашей аватарке.
                    </DialogDescriptionComponent>
                </DialogHeader>
                 {imgSrc && (
                    <div className="flex flex-col items-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img ref={imgRef} src={imgSrc} alt="Crop me" style={{ maxHeight: '70vh' }}/>
                        </ReactCrop>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setIsCropModalOpen(false);
                        setImgSrc('');
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }}>Отмена</Button>
                    <Button onClick={handleCropAndUpload} disabled={!completedCrop || isUploading}>
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Сохранить аватар
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
