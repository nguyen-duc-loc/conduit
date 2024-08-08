'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/common/Form';
import { UpdatePassWordSchema } from '@/forms/update-user-form';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import Spinner from '@/components/common/Spinner';
import { updatePassword } from '@/actions/user';

export default function AccountSettingsSection() {
  const [pending, startTransition] = useTransition();
  const updatePasswordForm = useForm<z.infer<typeof UpdatePassWordSchema>>({
    resolver: zodResolver(UpdatePassWordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  function onSubmit(updatePasswordFormData: z.infer<typeof UpdatePassWordSchema>) {
    startTransition(async () => {
      try {
        await updatePassword(updatePasswordFormData.password);
        toast.success(() => <p className="w-max">Your password has been changed</p>, {
          position: 'top-center'
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong. Try again later.', {
          position: 'top-center'
        });
      }
    });
  }

  return (
    <Form {...updatePasswordForm}>
      <form onSubmit={updatePasswordForm.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={updatePasswordForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input {...field} type="password" disabled={pending} maxLength={50} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={updatePasswordForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={pending} maxLength={50} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending && <Spinner className="w-4 h-4 mr-2" />}
          Change password
        </Button>
      </form>
    </Form>
  );
}
