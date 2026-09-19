import IncidentDetailClient from './IncidentDetailClient';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function IncidentDetailPage() {
  return <IncidentDetailClient />;
}
