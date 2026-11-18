export type AppStatus = 'available' | 'coming-soon';
export type AppDefinition = { id: string; title: string; status: AppStatus; url?: string };
export const apps: AppDefinition[] = [
  { id: 'finance', title: 'OpsFinance', status: 'available', url: 'https://app.myops.com.my' },
  { id: 'flow', title: 'OpsFlow', status: 'available', url: 'https://opsflow.myops.com.my' },
  { id: 'ps', title: 'OpsPS', status: 'available' },
  { id: 'hr', title: 'OpsHR', status: 'available' },
  { id: 'rental', title: 'OpsRental', status: 'available' },
  { id: 'wms', title: 'OpsWMS', status: 'coming-soon' },
  { id: 'smart-home', title: 'OpsSmartHome', status: 'coming-soon' },
  { id: 'clinic', title: 'OpsClinic', status: 'coming-soon' },
  { id: 'life', title: 'OpsLife', status: 'coming-soon' }
];
