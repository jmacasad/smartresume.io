export default function TermsModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(10,10,10,0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        height: '90%',
        position: 'relative',
        overflow: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '1.25rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1
        }}>✖</button>

        <iframe
          src="http://localhost:5173/terms"
          title="Terms and Conditions"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  );
}