import { Button } from '@/components/ui/Button';

interface Props {
  onCreate: () => void;
}

export function NewSessionButton({ onCreate }: Props) {
  return (
    <Button variant="primary" className="w-full" onClick={onCreate}>
      + New Session
    </Button>
  );
}
