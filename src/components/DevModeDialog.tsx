import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDevAuth } from '@/hooks/useDevAuth';

interface DevModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevModeDialog = ({ isOpen, onClose }: DevModeDialogProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { authenticate } = useDevAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authenticate(password)) {
      onClose();
      navigate('/dev-dashboard');
    } else {
      setError('Invalid password');
    }
    
    setPassword('');
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Developer Mode</DialogTitle>
          <DialogDescription>
            Enter the developer password to access analytics dashboard
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter developer password"
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password}>
              Access Dashboard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};