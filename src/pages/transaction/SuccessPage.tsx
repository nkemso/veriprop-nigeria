import SuccessFlow from './SuccessFlow';
export default function SuccessPage() {
  const txId = new URLSearchParams(window.location.search).get('tx') || undefined;
  return <SuccessFlow transactionId={txId} />;
}
