import { IncidentRedirectClient } from './IncidentRedirectClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function IncidentRedirectPage() {
  return <IncidentRedirectClient />;
}
