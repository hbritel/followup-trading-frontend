import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Conditions d'utilisation</h1>
        <p className="text-muted-foreground mb-8">Dernière mise à jour : mars 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
            <p className="text-muted-foreground leading-relaxed">
              En accédant à Followup Trading et en utilisant nos services, vous acceptez d'être lié par les présentes
              conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Followup Trading est une plateforme de journal de trading qui permet aux utilisateurs de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Importer et suivre leurs trades depuis plusieurs courtiers</li>
              <li>Analyser leurs performances de trading via des métriques et statistiques détaillées</li>
              <li>Tenir un journal de trading avec notes et annotations</li>
              <li>Générer des rapports de performance</li>
              <li>Recevoir des alertes et des insights basés sur leurs données de trading</li>
              <li>Exécuter des backtests sur leurs stratégies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Compte utilisateur</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">En créant un compte, vous vous engagez à :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
              <li>Ne pas créer de comptes multiples à des fins abusives</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Vous êtes responsable de toutes les activités effectuées sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Identifiants de courtier</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lorsque vous connectez un compte de courtage, vous nous autorisez à utiliser vos identifiants
              uniquement pour synchroniser vos données de trading. Vos identifiants sont chiffrés avec AES-256-GCM
              et ne sont jamais stockés en clair. Nous n'effectuons aucune opération de trading en votre nom.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Followup Trading est un outil d'analyse et de suivi. Nous ne fournissons aucun conseil en investissement,
              recommandation de trading, ou signal de trading. Les décisions de trading sont de votre entière responsabilité.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Les métriques et analyses fournies sont à titre informatif uniquement</li>
              <li>Nous ne garantissons pas l'exactitude à 100% des données synchronisées depuis les courtiers</li>
              <li>Nous ne sommes pas responsables des pertes de trading, quelle qu'en soit la cause</li>
              <li>Les résultats de backtesting ne garantissent pas les performances futures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'ensemble du contenu de la plateforme (code, design, textes, logos, algorithmes) est la propriété
              de Followup Trading et est protégé par les lois sur la propriété intellectuelle. Vous ne pouvez pas
              reproduire, distribuer ou modifier ce contenu sans autorisation écrite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Utilisation acceptable</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Tenter d'accéder aux données d'autres utilisateurs</li>
              <li>Utiliser la plateforme pour des activités illégales</li>
              <li>Surcharger intentionnellement nos serveurs</li>
              <li>Contourner les mesures de sécurité ou de limitation de débit</li>
              <li>Revendre ou redistribuer l'accès à la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Disponibilité du service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous nous efforçons de maintenir la plateforme disponible 24h/24, 7j/7. Cependant, nous ne garantissons
              pas une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance, mises à jour,
              ou en cas de force majeure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Résiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit de suspendre ou
              résilier votre compte en cas de violation des présentes conditions. En cas de résiliation,
              vos données seront supprimées conformément à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
              importantes seront communiquées par e-mail ou via une notification sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Droit applicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes conditions sont régies par le droit français. Tout litige sera soumis
              à la compétence exclusive des tribunaux français.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à ces conditions, veuillez nous contacter via
              notre <Link to="/contact" className="text-primary hover:underline">page de contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
