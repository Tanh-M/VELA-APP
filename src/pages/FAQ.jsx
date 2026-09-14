import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ArrowLeft, UserPlus, Cpu, Activity, Send } from 'lucide-react';
import { supabase } from '../services/supabase';
import logo from '../assets/icons/logo-sentinel.svg';
import './FAQ.css';

function FAQ() {
  // useSearchParams lit les paramètres présents dans l'URL (ex: ?from=settings)
  // Contrairement à location.state, ça survit à un rechargement complet de la page
  const [searchParams] = useSearchParams();
  const cameFromSettings = searchParams.get('from') === 'settings';

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
    { question: "Puis-je modifier les seuils qui déclenchent une alerte ?", answer: "Oui, rendez-vous dans la page Paramètres, section \"Seuils d'alerte\", pour personnaliser chaque valeur." },
    { question: "Que faire si un détecteur reste \"hors ligne\" longtemps ?", answer: "Vérifiez l'alimentation et la connexion réseau du détecteur concerné. S'il reste hors ligne, un problème matériel est probable." },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  function toggleFaq(index) {
    setOpenFaq(openFaq === index ? null : index);
  }

  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  // Envoie réellement la suggestion dans Supabase, liée à l'utilisateur connecté
  async function handleSuggestionSubmit(e) {
    e.preventDefault();
    if (!suggestion.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('faq_suggestions').insert({
      user_id: user.id,
      question: suggestion.trim(),
    });

    setSuggestionSent(true);
    setSuggestion('');
    setTimeout(() => setSuggestionSent(false), 3000);
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
          <p>Proposez votre question, nous y répondrons ici prochainement.</p>

          {suggestionSent ? (
            <p className="faq-suggest-success">Merci, votre question a bien été envoyée !</p>
          ) : (
            <form className="faq-suggest-form" onSubmit={handleSuggestionSubmit}>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Écrivez votre question ici..."
                rows={3}
                required
              />
              <button type="submit" className="auth-submit-btn faq-suggest-btn">
                <Send size={15} />
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default FAQ;