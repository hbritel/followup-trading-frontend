import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePropFirmTenant, usePropFirmDashboard } from '@/hooks/usePropFirmAdmin';

export const PropFirmSettings = () => {
  const [firmName, setFirmName] = useState('');
  const [firmCode, setFirmCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  const { data: dashboardData, isLoading } = usePropFirmDashboard();
  const createTenantMutation = useCreatePropFirmTenant();

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !firmCode || !adminEmail) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    createTenantMutation.mutate(
      { firmName, firmCode, adminEmail },
      {
        onSuccess: () => {
          toast.success('Prop Firm initialisée avec succès !');
        },
        onError: (error) => {
          toast.error('Erreur lors de la création de la Prop Firm');
          console.error('Failed to create tenant', error);
        },
      }
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground animate-pulse">Chargement de la configuration de votre Prop Firm...</div>;
  }

  // If dashboard loads successfully, it means they already have a tenant
  if (dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Statut de la Prop Firm
          </CardTitle>
          <CardDescription>
            Votre compte est déjà lié à une instance Prop Firm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground">La configuration de votre Prop Firm est active.</p>
            <p className="text-sm text-foreground font-medium mt-2">Vous pouvez gérer vos traders depuis le tableau de bord Admin Prop Firm.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Initialiser ma Prop Firm
        </CardTitle>
        <CardDescription>
          Créez votre propre Prop Firm pour commencer à onboarder et évaluer vos traders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTenant} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="firmName">Nom de la Prop Firm</Label>
            <Input
              id="firmName"
              placeholder="Ex: My Awesome Trading Firm"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firmCode">Code de la Firme (Unique)</Label>
            <Input
              id="firmCode"
              placeholder="Ex: MATF"
              value={firmCode}
              onChange={(e) => setFirmCode(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email de l'Administrateur</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="Ex: admin@myfirm.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={createTenantMutation.isPending}>
            {createTenantMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></span>
                Création en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Créer la Prop Firm
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
