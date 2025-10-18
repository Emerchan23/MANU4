'use client';

import { MainLayout } from '@/components/layout/main-layout';
import EquipmentList from '../../components/equipment/equipment-list';

export default function EquipmentPage() {
  return (
    <MainLayout>
      <EquipmentList />
    </MainLayout>
  );
}