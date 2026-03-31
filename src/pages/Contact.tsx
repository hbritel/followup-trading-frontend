import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, Globe, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">Contact</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Une question, un problème ou une suggestion ? N'hésitez pas à nous contacter.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">E-mail</h3>
                <p className="text-muted-foreground text-sm mb-2">Pour toute question générale</p>
                {/* TODO: Remplacer par votre adresse e-mail */}
                <a href="mailto:contact@votre-domaine.com" className="text-primary hover:underline text-sm">
                  contact@votre-domaine.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Support technique</h3>
                <p className="text-muted-foreground text-sm mb-2">Problèmes techniques et bugs</p>
                {/* TODO: Remplacer par votre adresse e-mail de support */}
                <a href="mailto:support@votre-domaine.com" className="text-primary hover:underline text-sm">
                  support@votre-domaine.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Site web</h3>
                <p className="text-muted-foreground text-sm mb-2">Notre site officiel</p>
                {/* TODO: Remplacer par votre nom de domaine */}
                <a href="https://votre-domaine.com" className="text-primary hover:underline text-sm" target="_blank" rel="noopener noreferrer">
                  votre-domaine.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Adresse</h3>
                <p className="text-muted-foreground text-sm mb-2">Siège social</p>
                {/* TODO: Remplacer par votre adresse */}
                <p className="text-sm text-muted-foreground">
                  France
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Délai de réponse</h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Nous nous efforçons de répondre à toutes les demandes dans un délai de 48 heures ouvrées.
            Pour les problèmes techniques urgents, veuillez utiliser l'adresse de support technique.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold">Liens utiles</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy">
              <Button variant="outline">Politique de confidentialité</Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline">Conditions d'utilisation</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
