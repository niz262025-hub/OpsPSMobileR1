import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../services/adminFoundation';
import { returnToMyops } from '../services/myopsNavigation';

export default function MyopsEntry() {
  const { currentUser, ready } = useAuth();
  useEffect(() => {
    if (!ready) return;
    if (!currentUser) returnToMyops();
    else if (isAdminRole(currentUser.role)) router.replace('/admin' as never);
    else if (currentUser.role === 'customer') router.replace('/customer' as never);
    else router.replace('/(tabs)/dashboard' as never);
  }, [currentUser, ready]);
  return null;
}
