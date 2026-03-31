import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>
        <p className="text-muted-foreground mb-8">Dernière mise à jour : mars 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Followup Trading s'engage à protéger la vie privée de ses utilisateurs.
              Cette politique de confidentialité décrit comment nous collectons, utilisons, stockons et protégeons
              vos informations personnelles lorsque vous utilisez notre plateforme de journal de trading.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Nous collectons les types de données suivants :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Informations de compte :</strong> adresse e-mail, nom d'utilisateur, mot de passe (haché)</li>
              <li><strong className="text-foreground">Données de trading :</strong> historique des trades importés depuis vos courtiers connectés (positions, P&L, symboles, dates)</li>
              <li><strong className="text-foreground">Identifiants de courtier :</strong> identifiants de connexion à vos comptes de courtage (chiffrés AES-256-GCM)</li>
              <li><strong className="text-foreground">Données d'utilisation :</strong> journaux d'activité, préférences d'interface, paramètres de notification</li>
              <li><strong className="text-foreground">Données techniques :</strong> adresse IP, type de navigateur, empreinte de dispositif (à des fins de sécurité uniquement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fournir et améliorer les services de journal de trading</li>
              <li>Calculer vos métriques de performance et statistiques</li>
              <li>Synchroniser vos trades depuis vos comptes de courtage</li>
              <li>Générer des rapports et des analyses personnalisés</li>
              <li>Assurer la sécurité de votre compte (détection de connexions suspectes, verrouillage après tentatives échouées)</li>
              <li>Vous envoyer des alertes et notifications que vous avez configurées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Sécurité des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous prenons la sécurité de vos données très au sérieux :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Les mots de passe sont hachés avec Bcrypt</li>
              <li>Les identifiants de courtier sont chiffrés avec AES-256-GCM avec rotation des clés</li>
              <li>L'authentification utilise des tokens JWT à courte durée de vie (15 minutes)</li>
              <li>L'authentification multi-facteurs (MFA) est disponible via TOTP et e-mail</li>
              <li>Les communications sont chiffrées via HTTPS/TLS</li>
              <li>Les comptes sont verrouillés après 5 tentatives de connexion échouées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Partage des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.
              Vos données de trading ne sont jamais partagées sans votre consentement explicite.
              Les seules communications avec des tiers concernent les API de vos courtiers pour la synchronisation de vos trades.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Conservation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la suppression
              complète de votre compte et de toutes les données associées à tout moment. Les données supprimées
              sont purgées de nos systèmes dans un délai de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Accès :</strong> demander une copie de vos données personnelles</li>
              <li><strong className="text-foreground">Rectification :</strong> corriger des données inexactes</li>
              <li><strong className="text-foreground">Suppression :</strong> demander la suppression de vos données</li>
              <li><strong className="text-foreground">Portabilité :</strong> exporter vos données dans un format standard (CSV, PDF)</li>
              <li><strong className="text-foreground">Opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous utilisons uniquement des cookies essentiels au fonctionnement de l'application
              (authentification, préférences d'interface). Nous n'utilisons pas de cookies de suivi
              publicitaire ni de cookies tiers à des fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits,
              veuillez nous contacter via notre <Link to="/contact" className="text-primary hover:underline">page de contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
