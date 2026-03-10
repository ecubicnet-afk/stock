import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { VisionMapData, VisionDream, VisionImage } from '../types';

const INITIAL: VisionMapData = { dreams: [], images: [] };

export function useVisionMap() {
  const [data, setData] = useLocalStorage<VisionMapData>('stock-app-vision-map', INITIAL);

  const addDream = useCallback((text: string) => {
    const dream: VisionDream = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, dreams: [...prev.dreams, dream] }));
  }, [setData]);

  const updateDream = useCallback((id: string, updates: Partial<VisionDream>) => {
    setData((prev) => ({
      ...prev,
      dreams: prev.dreams.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  }, [setData]);

  const deleteDream = useCallback((id: string) => {
    setData((prev) => ({ ...prev, dreams: prev.dreams.filter((d) => d.id !== id) }));
  }, [setData]);

  const addImage = useCallback((img: Omit<VisionImage, 'id'>) => {
    const image: VisionImage = { ...img, id: crypto.randomUUID() };
    setData((prev) => ({ ...prev, images: [...prev.images, image] }));
  }, [setData]);

  const updateImage = useCallback((id: string, updates: Partial<VisionImage>) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  }, [setData]);

  const deleteImage = useCallback((id: string) => {
    setData((prev) => ({ ...prev, images: prev.images.filter((i) => i.id !== id) }));
  }, [setData]);

  return { data, addDream, updateDream, deleteDream, addImage, updateImage, deleteImage };
}
