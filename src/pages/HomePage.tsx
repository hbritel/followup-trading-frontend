
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { BarChart3, TrendingUp, Shield, Zap, LineChart, BarChart2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className="border-b border-border sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">FT</div>
            <span className="text-xl font-semibold">Followup Trading</span>
          </div>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-6">
              <NavigationMenuItem>
                <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground">
                  Fonctionnalités
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground">
                  Tarifs
                </a>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <Link to="/auth/login">
              <Button variant="outline" size="sm">Connexion</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">Inscription</Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Optimisez votre <span className="text-primary">trading</span> avec des données exploitables
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Suivez vos performances, identifiez vos points forts et améliorez vos résultats grâce à des analyses détaillées.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/auth/signup">
                <Button size="lg" className="gap-2">
                  Commencer gratuitement
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Découvrir les fonctionnalités
                </Button>
              </a>
            </div>
          </div>
          
          {/* Preview Image */}
          <div className="mt-16 max-w-5xl mx-auto rounded-xl overflow-hidden border border-border shadow-lg">
            <img 
              src="/placeholder.svg" 
              alt="Dashboard Preview" 
              className="w-full h-auto"
              style={{ aspectRatio: '16/9' }}
            />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-accent/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour suivre et améliorer vos performances de trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyse des performances</h3>
              <p className="text-muted-foreground">
                Suivez vos performances avec des graphiques détaillés, des métriques clés et des analyses temporelles.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Journal de trading</h3>
              <p className="text-muted-foreground">
                Documentez vos trades avec des notes, des captures d'écran et des leçons apprises pour améliorer votre stratégie.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestion des risques</h3>
              <p className="text-muted-foreground">
                Surveillez vos métriques de risque et optimisez votre gestion de capital pour des résultats durables.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Alertes personnalisables</h3>
              <p className="text-muted-foreground">
                Configurez des alertes pour vous avertir des opportunités de marché ou des risques potentiels.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Backtesting</h3>
              <p className="text-muted-foreground">
                Testez vos stratégies sur des données historiques pour valider leur efficacité avant de les appliquer.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Statistiques avancées</h3>
              <p className="text-muted-foreground">
                Accédez à des statistiques détaillées pour identifier vos forces et les domaines à améliorer.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Plans tarifaires</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choisissez le plan qui correspond le mieux à vos besoins
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm flex flex-col">
              <div className="mb-5">
                <h3 className="text-xl font-semibold">Gratuit</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  0€<span className="ml-1 text-2xl text-muted-foreground">/mois</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">Parfait pour débuter et explorer les fonctionnalités essentielles</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Jusqu'à 100 trades par mois</span>
                </li>
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Journal de trading basique</span>
                </li>
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Statistiques de base</span>
                </li>
              </ul>
              <Link to="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">S'inscrire</Button>
              </Link>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-primary rounded-xl p-8 border border-primary shadow-lg flex flex-col scale-105 z-10">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-primary-foreground">Pro</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-primary-foreground">
                  29€<span className="ml-1 text-2xl opacity-70">/mois</span>
                </div>
              </div>
              <p className="text-primary-foreground opacity-70 mb-6">Idéal pour les traders actifs cherchant à optimiser leurs résultats</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Trades illimités</span>
                </li>
                <li className="flex text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Journal de trading avancé</span>
                </li>
                <li className="flex text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Statistiques détaillées</span>
                </li>
                <li className="flex text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Backtesting</span>
                </li>
                <li className="flex text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>Alertes personnalisables</span>
                </li>
              </ul>
              <Link to="/auth/signup" className="w-full">
                <Button className="w-full bg-background text-primary hover:bg-background/90">Essai gratuit de 14 jours</Button>
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-background rounded-xl p-6 border border-border shadow-sm flex flex-col">
              <div className="mb-5">
                <h3 className="text-xl font-semibold">Entreprise</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  99€<span className="ml-1 text-2xl text-muted-foreground">/mois</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">Pour les équipes professionnelles et les institutions financières</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Tout ce qui est inclus dans Pro</span>
                </li>
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Gestion d'équipes</span>
                </li>
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>API avancée</span>
                </li>
                <li className="flex">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <Link to="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">Nous contacter</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 bg-primary/10">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Prêt à améliorer votre trading?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Rejoignez des milliers de traders qui ont optimisé leurs performances avec notre plateforme.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth/signup">
              <Button size="lg">Commencer gratuitement</Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline">Se connecter</Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">FT</div>
              <span className="text-xl font-semibold">Followup Trading</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Confidentialité</Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Conditions d'utilisation</Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-8">
            &copy; {new Date().getFullYear()} Followup Trading. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
