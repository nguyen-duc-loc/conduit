import Spinner from '@/components/Spinner';

export default function Loading() {
  return (
    <div className="w-full pt-6 pb-4 px-8 h-fit flex justify-center">
      <Spinner className="my-2 w-7 h-7 stroke-primary" />
    </div>
  );
}
