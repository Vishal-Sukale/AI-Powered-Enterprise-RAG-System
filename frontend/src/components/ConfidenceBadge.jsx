export default function ConfidenceBadge({ score }) {
  const getStyle = () => {
    if (score >= 75) return 'bg-accent-500/10 text-accent-400 border-accent-500/20'
    if (score >= 45) return 'bg-brand-500/10 text-brand-400 border-brand-500/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const getDot = () => {
    if (score >= 75) return 'bg-accent-400'
    if (score >= 45) return 'bg-brand-400'
    return 'bg-red-400'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border backdrop-blur-xs ${getStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDot()}`} />
      Confidence: {score}%
    </span>
  )
}
