import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ArrowLeft, UserPlus, Cpu, Activity, Send, HelpCircle, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';
// AJOUT 1 : pour savoir si l'utilisateur est connecté (la FAQ est une page publique)
import { useAuth } from '../context/AuthContext';
import logo from '../assets/icons/logo-vela.svg';
import './FAQ.css';

// ===== Réglages de l'affichage de "Mes questions" =====
const MAX_STORED_QUESTIONS = 30; // nombre de questions chargées
const FOLD_ABOVE = 3; // au-delà de 3 questions, les plus anciennes sont repliées
const ALWAYS_VISIBLE = 2; // nombre de questions récentes toujours visibles

// Date au format français : "21/10/2026"
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function FAQ() {
  // useSearchParams lit les paramètres présents dans l'URL (ex: ?from=settings)
  // Contrairement à location.state, ça survit à un rechargement complet de la page
  const [searchParams] = useSearchParams();
  const cameFromSettings = searchParams.get('from') === 'settings';

  const { currentUser } = useAuth();

  const backTo = cameFromSettings ? '/parametres' : '/';
  const backLabel = cameFromSettings ? 'Retour aux paramètres' : "Retour à l'accueil";

  const steps = [
    { icon: UserPlus, title: 'Créez votre compte', text: 'Inscrivez-vous en quelques secondes, gratuitement.' },
    { icon: Cpu, title: 'Ajoutez vos détecteurs', text: 'Enregistrez chaque détecteur installé dans votre maison.' },
    { icon: Activity, title: 'Surveillez en temps réel', text: 'Consultez vos données et recevez des alertes automatiques.' },
  ];

  const faqs = [
    { question: 'Quels types de capteurs Vela peut-il superviser ?', answer: 'Vela supervise des détecteurs de fumée, de gaz, de température et de flamme, installés dans votre maison ou votre parcelle.' },
    { question: "Ai-je besoin d'une connexion internet permanente ?", answer: "Oui, vos détecteurs doivent être connectés à internet pour transmettre leurs données à la plateforme en temps réel." },
    { question: "Puis-je ajouter plusieurs détecteurs ?", answer: "Oui, vous pouvez ajouter autant de détecteurs que nécessaire, placés dans différents endroits (maison, garage, jardin...)." },
    { question: "Que se passe-t-il si une anomalie est détectée ?", answer: "Vela affiche immédiatement une alerte avec le type d'anomalie, le détecteur concerné et l'heure de détection." },
    { question: "Est-ce que mes données sont visibles par d'autres utilisateurs ?", answer: "Non, chaque compte est totalement indépendant. Vous ne voyez que vos propres détecteurs et vos propres données." },
    { question: "Combien coûte l'utilisation de Vela ?", answer: "Vela est un projet académique développé dans le cadre d'un mémoire de fin d'études, non commercialisé pour le moment." },
    { question: "Que faire si j'oublie mon mot de passe ?", answer: "Utilisez le lien \"Mot de passe oublié ?\" sur la page de connexion pour recevoir un email de réinitialisation." },
    { question: "Puis-je modifier les seuils qui déclenchent une alerte ?", answer: "Oui. Rendez-vous dans la page Appareils, ouvrez le menu ⋮ du détecteur concerné et choisissez \"Modifier les seuils\". Chaque détecteur peut avoir ses propres seuils. Les valeurs par défaut sont visibles dans la page Paramètres." },
    { question: "Que faire si un détecteur reste \"hors ligne\" longtemps ?", answer: "Vérifiez l'alimentation et la connexion réseau du détecteur concerné. S'il reste hors ligne, un problème matériel est probable." },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  function toggleFaq(index) {
    setOpenFaq(openFaq === index ? null : index);
  }

  // ===== AJOUT 2 : "Mes questions" (en haut de la page) =====
  // Les 5 dernières questions posées par l'utilisateur connecté, avec leur réponse
  const [myQuestions, setMyQuestions] = useState([]);
  // Le dérouleur des anciennes questions est fermé par défaut
  const [showOlder, setShowOlder] = useState(false);

  const fetchMyQuestions = useCallback(async () => {
    if (!currentUser) {
      setMyQuestions([]);
      return;
    }

    const { data, error } = await supabase
      .from('faq_suggestions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(MAX_STORED_QUESTIONS);

    if (!error && data) setMyQuestions(data);
  }, [currentUser]);

  // Charge les questions à l'ouverture de la page (et quand l'utilisateur change)
  useEffect(() => {
    fetchMyQuestions();
  }, [fetchMyQuestions]);

  // Une réponse est "nouvelle" tant que l'utilisateur ne l'a pas vue (seen_at vide)
  const hasNewAnswer = myQuestions.some((q) => q.answer && !q.seen_at);

  // Après 5 secondes sur la page, on marque les réponses comme lues dans Supabase.
  // Elles restent soulignées en rouge pendant cette visite, mais ne le seront plus la prochaine fois.
  useEffect(() => {
    if (!hasNewAnswer) return;
    const timer = setTimeout(() => {
      supabase.rpc('mark_faq_answers_seen');
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasNewAnswer]);

  // ===== Envoi d'une nouvelle question =====
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  async function handleSuggestionSubmit(e) {
    e.preventDefault();
    if (!suggestion.trim() || !currentUser) return;

    setSending(true);
    setSendError('');

    const { error } = await supabase.from('faq_suggestions').insert({
      user_id: currentUser.id,
      question: suggestion.trim(),
    });

    setSending(false);

    // Erreur : on l'affiche au lieu de rester silencieux
    // (le message "Limite ..." vient de la règle des 5 questions par jour dans Supabase)
    if (error) {
      setSendError(
        error.message && error.message.includes('Limite')
          ? error.message
          : "L'envoi a échoué. Réessayez dans un instant."
      );
      return;
    }

    setSuggestion('');
    setSuggestionSent(true);
    fetchMyQuestions(); // la nouvelle question apparaît tout de suite en haut, "en attente"
    setTimeout(() => setSuggestionSent(false), 6000);
  }

  // ===== Pile de questions : les récentes dehors, les anciennes dans un dérouleur =====
  // Une question dont la réponse vient d'arriver (pas encore vue) reste TOUJOURS dehors.
  // myQuestions est trié de la plus récente à la plus ancienne.
  const isNewAnswer = (q) => Boolean(q.answer) && !q.seen_at;
  let visibleQuestions = myQuestions;
  let olderQuestions = [];

  if (myQuestions.length > FOLD_ABOVE) {
    visibleQuestions = myQuestions.filter((q, index) => index < ALWAYS_VISIBLE || isNewAnswer(q));
    olderQuestions = myQuestions.filter((q, index) => !(index < ALWAYS_VISIBLE || isNewAnswer(q)));
  }

  // Dessine UNE question avec sa réponse (utilisé pour la liste visible et pour le dérouleur)
  function renderQuestionCard(q, index) {
    const answered = Boolean(q.answer);
    const isNew = isNewAnswer(q); // réponse pas encore vue

    return (
      <article key={q.id ?? q.created_at ?? index} className={`my-question ${isNew ? 'my-question-new' : ''}`}>
        <div className="my-question-head">
          {/* Question soulignée en rouge quand la réponse est nouvelle */}
          <p className={`my-question-text ${isNew ? 'my-question-text-new' : ''}`}>{q.question}</p>
          {isNew && <span className="my-question-badge">Nouvelle réponse</span>}
        </div>

        {answered ? (
          <p className="my-question-answer">{q.answer}</p>
        ) : (
          <p className="my-question-pending">
            <Clock size={14} />
            En attente de réponse...
          </p>
        )}

        <p className="my-question-date">Posée le {formatDate(q.created_at)}</p>
      </article>
    );
  }

  return (
    <div className="faq-page">
      <header className="faq-header fade-in-up">
        <Link to={backTo} className="faq-back-link">
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
        <div className="home-logo">
          <img src={logo} alt="Vela" className="logo-icon" />
          <span>Vela</span>
        </div>
      </header>

      <div className="faq-content">
        {/* ===== Bloc "Mes questions", tout en haut de la page ===== */}
        {currentUser && myQuestions.length > 0 && (
          <section className="my-questions">
            <h2 className="my-questions-title">
              <HelpCircle size={18} />
              Mes questions
            </h2>

            {/* Questions récentes (et réponses toutes nouvelles) : toujours visibles */}
            {visibleQuestions.map((q, index) => renderQuestionCard(q, index))}

            {/* Questions plus anciennes : repliées dans un dérouleur */}
            {olderQuestions.length > 0 && (
              <div className="my-questions-older">
                <button
                  type="button"
                  className="my-questions-toggle"
                  onClick={() => setShowOlder(!showOlder)}
                  aria-expanded={showOlder}
                >
                  <span>Questions précédentes ({olderQuestions.length})</span>
                  <ChevronDown size={18} className={`faq-chevron ${showOlder ? 'faq-chevron-open' : ''}`} />
                </button>

                {showOlder && (
                  <div className="my-questions-older-list">
                    {olderQuestions.map((q, index) => renderQuestionCard(q, index))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <h1 className="faq-title-animated">Comment fonctionne Vela</h1>
        <p className="faq-page-subtitle faq-subtitle-animated">Trois étapes simples pour protéger votre maison</p>

        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="step-card step-card-animated" style={{ animationDelay: `${index * 0.1}s` }} key={index}>
                <div className="step-number">{index + 1}</div>
                <div className="step-icon-wrap">
                  <Icon size={22} color="var(--accent)" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            );
          })}
        </div>

        <h1 className="faq-second-title faq-title-animated">Questions fréquentes</h1>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className="faq-item faq-item-animated" style={{ animationDelay: `${index * 0.06}s` }} key={index}>
              <button className="faq-question" onClick={() => toggleFaq(index)}>
                <span>{faq.question}</span>
                <ChevronDown size={18} className={`faq-chevron ${openFaq === index ? 'faq-chevron-open' : ''}`} />
              </button>

              {openFaq === index && (
                <p className="faq-answer faq-answer-open">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>

        <div className="faq-suggest-card faq-suggest-animated">
          <h3>Vous ne trouvez pas votre réponse ?</h3>
          <p>
            Posez votre question : la réponse apparaîtra en haut de cette page, et vous serez
            prévenu par notification si vous les avez activées dans les Paramètres.
          </p>

          {!currentUser ? (
            // Visiteur non connecté : on lui demande de se connecter (avant, l'envoi échouait en silence)
            <p className="faq-suggest-login">
              <Link to="/login">Connectez-vous</Link> pour poser une question.
            </p>
          ) : suggestionSent ? (
            <p className="faq-suggest-success">Question bien envoyée ! Nous vous répondrons très bientôt.</p>
          ) : (
            <form className="faq-suggest-form" onSubmit={handleSuggestionSubmit}>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Écrivez votre question ici..."
                rows={3}
                maxLength={500}
                required
              />
              {sendError && <p className="faq-suggest-error">{sendError}</p>}
              <button type="submit" className="auth-submit-btn faq-suggest-btn" disabled={sending}>
                <Send size={15} />
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default FAQ;