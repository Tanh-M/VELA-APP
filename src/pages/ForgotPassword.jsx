import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/icons/logo-vela.svg';
import { supabase } from '../services/supabase';
import './Login.css';

// Délai avant de pouvoir redemander un code (en secondes)
const RESEND_DELAY = 60;

function ForgotPassword() {
  const navigate = useNavigate();

  // Étapes : 'email' (adresse) → 'code' (code + nouveau mot de passe)
  //          → 'mfa' (code de l'application, SEULEMENT si la double authentification est activée)
  //          → 'done' (terminé)
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0); // secondes avant de pouvoir renvoyer un code
  const [verified, setVerified] = useState(false); // le code reçu par e-mail a-t-il déjà été validé ?

  // Compte à rebours du bouton "Renvoyer le code"
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ===== Envoi du code par e-mail. Renvoie true si l'envoi a abouti =====
  async function sendCode() {
    setError('');
    setInfo('');
    setIsSubmitting(true);

    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim());

    setIsSubmitting(false);

    if (sendError) {
      setError(
        sendError.status === 429
          ? 'Trop de demandes. Patientez une minute avant de réessayer.'
          : "Impossible d'envoyer le code pour le moment. Réessayez dans un instant."
      );
      return false;
    }

    setCooldown(RESEND_DELAY);
    return true;
  }

  // ===== Étape 1 : l'utilisateur a saisi son adresse e-mail =====
  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    const ok = await sendCode();
    if (ok) {
      setStep('code');
      // Message volontairement neutre : on ne révèle pas si l'adresse existe ou non
      setInfo(
        "Si un compte existe pour cette adresse, un code à 6 chiffres vient d'être envoyé. " +
        'Pensez à vérifier vos courriers indésirables.'
      );
    }
  }

  async function handleResend() {
    if (cooldown > 0 || isSubmitting) return;
    const ok = await sendCode();
    if (ok) setInfo('Un nouveau code a été envoyé.');
  }

  // ===== Enregistre le nouveau mot de passe, puis termine =====
  async function savePassword() {
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setIsSubmitting(false);
      setError(
        /different|same/i.test(updateError.message || '')
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : 'Impossible de changer le mot de passe : ' + updateError.message
      );
      return;
    }

    // On ferme la session temporaire : l'utilisateur se reconnectera avec son nouveau mot de passe
    await supabase.auth.signOut();
    setIsSubmitting(false);
    setStep('done');
  }

  // ===== Étape 2 : code reçu + nouveau mot de passe =====
  async function handleCodeSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanCode = code.replace(/\s/g, '');

    if (cleanCode.length < 6) {
      setError('Saisissez le code reçu par e-mail.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    // a) Vérification du code (il ne sert qu'une fois, d'où le suivi "verified")
    if (!verified) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanCode,
        type: 'recovery',
      });

      if (verifyError) {
        setIsSubmitting(false);
        setError('Code incorrect ou expiré. Vérifiez-le ou demandez-en un nouveau.');
        return;
      }
      setVerified(true);
    }

    // b) Le compte a-t-il la double authentification ? Si oui, Supabase exige le code de
    //    l'application AVANT de changer le mot de passe : on passe à l'étape 'mfa'.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      setIsSubmitting(false);
      setStep('mfa');
      return;
    }

    // c) Pas de double authentification : on change directement le mot de passe
    await savePassword();
  }

  // ===== Étape 3 (seulement avec double authentification) : code de l'application =====
  async function handleMfaSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanTotp = totpCode.replace(/\s/g, '');
    if (cleanTotp.length < 6) {
      setError("Saisissez le code à 6 chiffres affiché dans votre application d'authentification.");
      return;
    }

    setIsSubmitting(true);

    // On retrouve le facteur (l'application d'authentification) enregistré pour ce compte
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const factor = factorsData?.totp?.[0];

    if (!factor) {
      setIsSubmitting(false);
      setError("Aucune application d'authentification n'est associée à ce compte.");
      return;
    }

    const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: cleanTotp,
    });

    if (mfaError) {
      setIsSubmitting(false);
      setError("Code de l'application incorrect. Attendez le prochain code et réessayez.");
      return;
    }

    // Code correct : la session est validée, on peut changer le mot de passe
    await savePassword();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="VELA" className="logo-icon" />
          <span>VELA</span>
        </div>

        {/* ===== Étape 1 : adresse e-mail ===== */}
        {step === 'email' && (
          <>
            <h2>Mot de passe oublié</h2>
            <p className="auth-subtitle">
              Entrez votre email, nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe.
            </p>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleEmailSubmit} className="auth-form">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
              </button>
            </form>
          </>
        )}

        {/* ===== Étape 2 : code reçu et nouveau mot de passe ===== */}
        {step === 'code' && (
          <>
            <h2>Saisissez votre code</h2>
            <p className="auth-subtitle">
              Code envoyé à {email.trim()}.{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setInfo('');
                  setVerified(false);
                }}
              >
                Changer d'adresse
              </button>
            </p>

            {info && <p className="auth-success">{info}</p>}
            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleCodeSubmit} className="auth-form">
              <label>
                Code à 6 chiffres
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9\s]/g, ''))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  className="auth-code-input"
                  required
                  autoFocus
                />
              </label>

              <label>
                Nouveau mot de passe
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                Confirmer le mot de passe
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  autoComplete="new-password"
                  required
                />
              </label>

              <button type="button" className="auth-link-btn" onClick={() => setShowPasswords(!showPasswords)}>
                {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
              </button>

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Vérification...' : 'Changer le mot de passe'}
              </button>

              <button
                type="button"
                className="auth-secondary-btn"
                onClick={handleResend}
                disabled={cooldown > 0 || isSubmitting}
              >
                {cooldown > 0 ? `Renvoyer le code (${cooldown} s)` : 'Renvoyer le code'}
              </button>
            </form>
          </>
        )}

        {/* ===== Étape 3 : double authentification (seulement si elle est activée sur le compte) ===== */}
        {step === 'mfa' && (
          <>
            <h2>Double authentification</h2>
            <p className="auth-subtitle">
              Votre compte est protégé. Ouvrez votre application d'authentification et saisissez
              le code à 6 chiffres affiché pour Vela.
            </p>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleMfaSubmit} className="auth-form">
              <label>
                Code de l'application
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9\s]/g, ''))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  className="auth-code-input"
                  required
                  autoFocus
                />
              </label>

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Vérification...' : 'Valider et changer le mot de passe'}
              </button>
            </form>
          </>
        )}

        {/* ===== Terminé ===== */}
        {step === 'done' && (
          <>
            <h2>Mot de passe modifié</h2>
            <p className="auth-subtitle">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>

            <p className="auth-success">Votre mot de passe a bien été mis à jour.</p>

            <button type="button" className="auth-submit-btn" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </>
        )}

        {step !== 'done' && (
          <p className="auth-switch">
            <Link to="/login">Retour à la connexion</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;