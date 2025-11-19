import { Header } from '@/components/layout/Header'
import PredictionDashboard from '@/components/predict/PredictionDashboard'

export default function PredictPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <PredictionDashboard />
      </div>
    </div>
  )
}
