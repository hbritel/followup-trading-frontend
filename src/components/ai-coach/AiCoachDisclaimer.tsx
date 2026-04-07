import React from 'react';

const AiCoachDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200">
      <strong>Note:</strong> AI Coach provides behavioral analysis based on your trading history.
      This is not investment advice. All trading decisions are your sole responsibility.
    </div>
  );
};

export default AiCoachDisclaimer;
