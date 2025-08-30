'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, User, Globe, Image as ImageIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { Button } from '@/components/ui/button';
import { FormInput } from './FormInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/utils/storage';
import { useState, useRef, ChangeEvent } from 'react';

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  full_name: z.string().max(50, 'Name must be less than 50 characters').optional(),
  website: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.user_metadata?.username || '',
      full_name: user?.user_metadata?.full_name || '',
      website: user?.user_metadata?.website || '',
      bio: user?.user_metadata?.bio || '',
    },
  });

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file (JPEG, PNG, etc.)',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 2MB',
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      let avatarUrl = user?.user_metadata?.avatar_url || '';
      
      // Upload new avatar if selected
      if (avatarFile) {
        const { publicUrl } = await uploadFile(avatarFile, 'profile', {
          public: true,
          path: `avatars/${user?.id}/`,
        });
        avatarUrl = publicUrl;
      } else if (avatarPreview === null && user?.user_metadata?.avatar_url) {
        // If avatar was removed
        avatarUrl = '';
      }
      
      // Update profile
      const updates = {
        username: data.username,
        full_name: data.full_name,
        website: data.website,
        bio: data.bio,
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      };
      
      const { error } = await updateProfile(updates);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      
      // Reset form state
      reset({
        username: data.username,
        full_name: data.full_name,
        website: data.website,
        bio: data.bio,
      });
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = avatarPreview || user?.user_metadata?.avatar_url;
  const currentInitials = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={cn('space-y-8', className)} {...props}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground">
          Update your profile information and avatar.
        </p>
      </div>
      
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
        <div className="relative group">
          <Avatar className="w-24 h-24">
            <AvatarImage 
              src={currentAvatar} 
              alt={`${user?.email}'s avatar`} 
              className="object-cover"
            />
            <AvatarFallback className="text-2xl">
              {currentInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <label 
              htmlFor="avatar-upload"
              className="p-2 text-white bg-black/50 rounded-full cursor-pointer hover:bg-black/70"
              title="Change avatar"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="sr-only">Change avatar</span>
              <input
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            
            {currentAvatar && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeAvatar();
                }}
                className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full -mt-1 -mr-1 hover:bg-red-600"
                title="Remove avatar"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Remove avatar</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Profile photo</p>
          <p className="mt-1">JPG, GIF or PNG. Max size of 2MB</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Change photo
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormInput
            id="username"
            label="Username"
            placeholder="yourusername"
            error={errors.username?.message}
            leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('username')}
          />
          
          <FormInput
            id="full_name"
            label="Full name"
            placeholder="Your name"
            error={errors.full_name?.message}
            leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('full_name')}
          />
          
          <FormInput
            id="website"
            label="Website"
            placeholder="https://example.com"
            error={errors.website?.message}
            leftIcon={<Globe className="w-4 h-4 text-muted-foreground" />}
            disabled={isLoading}
            {...register('website')}
          />
          
          <div className="space-y-2">
            <label 
              htmlFor="bio" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Bio
            </label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors.bio?.message && 'border-destructive focus-visible:ring-destructive/30',
              )}
              disabled={isLoading}
              {...register('bio')}
              rows={3}
            />
            {errors.bio?.message && (
              <p className="text-xs text-destructive">{errors.bio.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('bio')?.length || 0}/160 characters
            </p>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            type="submit" 
            disabled={isLoading || !isDirty}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
