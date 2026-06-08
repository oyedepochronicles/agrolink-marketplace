import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyEmail(token)
      .then((data) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(
          data.alreadyVerified
            ? 'This email address is already verified.'
            : data.message || 'Your email has been verified successfully.',
        );
        setEmail(data.user?.email || '');
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error.message || 'Verification failed. The link may be invalid or expired.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="page">
        <div className="card">
          <div className="spinner" />
          <h1>Verifying your email</h1>
          <p>Please wait while we confirm your verification link…</p>
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="page">
        <div className="card">
          <div className="icon error">!</div>
          <h1>Missing verification link</h1>
          <p>Open the verification link from your email, or request a new one from account settings.</p>
          <Link to="/account" className="btn btn-primary">Go to account</Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="page">
        <div className="card">
          <div className="icon success">✓</div>
          <h1>Email verified</h1>
          <p>{message}</p>
          {email && <p><strong>{email}</strong> is now verified. You will receive updates and announcements in your inbox.</p>}
          <Link to="/account" className="btn btn-primary">Continue to account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="icon error">✕</div>
        <h1>Verification failed</h1>
        <p>{message}</p>
        <p>You can request a new verification email from your account settings.</p>
        <Link to="/account" className="btn btn-primary">Go to account</Link>
      </div>
    </div>
  );
}
