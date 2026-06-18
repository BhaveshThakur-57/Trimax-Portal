import { useState, useEffect } from 'react';

export const useSidebar = () => {
  // ✅ SSR-safe
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsOpen(window.innerWidth >= 768);
    };

    checkScreen();

    window.addEventListener('resize', checkScreen);

    return () => {
      window.removeEventListener('resize', checkScreen);
    };
  }, []);

  const toggle = () => setIsOpen(prev => !prev);
  const open   = () => setIsOpen(true);
  const close  = () => setIsOpen(false);

  return { isOpen, toggle, open, close };
};