import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Receipt, Calendar, Printer, Edit, Send, FileText, ArrowLeft, CheckCircle2, Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { format, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFactureDetail } from '@/hooks/useFactureDetail';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const ClientFactureDetail: React.FC = () => {
  const { clientId, factureId } = useParams<{ clientId: string; factureId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();

  // ✅ Hook React Query
  const { facture, isLoading, marquerPayee } = useFactureDetail(clientId!, factureId!);

  const parseDateSafe = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return parseISO(dateStr);
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr?: string) => {
    const date = parseDateSafe(dateStr);
    return date ? format(date, 'dd MMMM yyyy', { locale: fr }) : '—';
  };

  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(amount));

  const downloadFacturePDF = () => {
    window.open(`${api.defaults.baseURL}/api/factures/${factureId}/pdf`, '_blank');
  };

  const handleRelancer = () => {
    if (!facture) return;
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${facture.client.email}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Facture non trouvée</p>
        <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux ventes
        </Button>
      </div>
    );
  }

  const isOverdue = facture.statut !== 'payé' && parseDateSafe(facture.date_echeance) && isBefore(parseDateSafe(facture.date_echeance)!, today);
  const getStatus = () => {
    if (facture.statut === 'payé') return 'paid';
    if (isOverdue) return 'overdue';
    return 'unpaid';
  };

  const tva_calcul = facture.lignes.reduce((acc, ligne) => {
    const totalHT = ligne.quantite * ligne.nombre_jours * ligne.prix_unitaire;
    const tvaMontant = totalHT * (ligne.tva / 100);
    return acc + tvaMontant;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Facture ${facture.numero_facture}`}
        description={`Client: ${facture.client.nom_societe} • Émise le ${formatDate(facture.date_facture)}`}
        showBack
        onBack={() => {
          if (document.referrer.includes('/dashboard')) {
            navigate('/dashboard');
          } else {
            navigate(-1);
          }
        }}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={downloadFacturePDF}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer Facture
            </Button>

            <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/factures/${factureId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>

            {facture.statut !== 'payé' && (
              <>
                <Button variant="outline" onClick={handleRelancer}>
                  <Send className="h-4 w-4 mr-2" />
                  Relancer
                </Button>
                <Button onClick={() => marquerPayee()}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer payée
                </Button>
              </>
            )}
          </div>
        }
      />

      {isOverdue && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cette facture est en retard de paiement. Échéance: {formatDate(facture.date_echeance)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ... Reste du JSX identique ... */}
    </div>
  );
};

export default ClientFactureDetail;