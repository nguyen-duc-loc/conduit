import { cookies } from 'next/headers';

import { getCurrentUser } from '@/data/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Card } from '@/components/Card';
import CreatePostDialog from '@/components/Dialog/CreatePostDialog';

export default async function CreatePostSection() {
  const currentUser = await getCurrentUser(cookies().get('AUTH_TOKEN')?.value);
  if (!currentUser) return null;

  const { username, image } = currentUser;

  return (
    <Card className="px-6 py-4 flex gap-3 w-full items-center">
      <Avatar className="w-9 h-9">
        <AvatarImage src={image} alt={`${username} avatar`} />
        <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <CreatePostDialog />
    </Card>
  );
}
