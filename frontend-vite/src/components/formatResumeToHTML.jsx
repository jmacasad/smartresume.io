import SafeMarkdown from './SafeMarkdown';

const formatResumeToHTML = (raw) => {
  if (!raw) return null; // or a fallback UI

  return (
    <div className="resume-container">
      <SafeMarkdown>
        {raw}
      </SafeMarkdown>
    </div>
  );
};

export default formatResumeToHTML;
