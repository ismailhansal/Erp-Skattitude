<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 20mm; }

        body {
            font-family:"Times New Roman", serif;
            font-size: 14px;
            color: #111;
            line-height: 1.4;
        }

        .header {
            margin-bottom: 20px;
            border-top: 1px solid #000;
            padding-bottom: 10px;
            margin-bottom: 0px;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .devis-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 60px;
        }

        th, td {
            border: none;
            border-bottom: 1px solid #ddd;
            padding: 8px 6px;
            text-align: center;
        }

        th {
            background: transparent;
            font-weight: bold;
            border-bottom: 2px solid #000;
        }
        
        tbody tr:last-child td {
            border-bottom: 2px solid #000;
        }

        .description-col {
            text-align: left;
            width: 40%;
            margin-top: 40px;
        }

        .price-col {
            text-align: right;
        }

        .totals-section {
            margin-top: 20px;
            width: 40%;
            float: right;
            clear: both;
        }

        .totals-table {
            border: none;
            width: 100%;
        }

        .totals-table td {
            border: none;
            border-bottom: 1px solid #ddd;
            padding: 8px 0;
        }
        
        .totals-table tr:last-child td {
            border-bottom: 2px solid #000;
            padding-top: 10px;
        }

        .total-label {
            text-align: left;
            padding-right: 20px;
        }

        .total-value {
            text-align: right;
            font-weight: bold;
        }

        .footer {
            position: fixed;
            bottom: 15px;
            font-size: 9px;
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 5px;
            text-align: center;
        }

        .client-info {
            margin: 10px 0;
            padding-left: 10px;
            border-left: 3px solid #ccc;
        }

        .separator {
            margin: 15px 0;
            border-top: 1px solid #ddd;
        }

        /* Pour le pied de page dynamique */
        .footer-content {
            white-space: nowrap;
        }
        
        /* Styles pour l'alignement logo + infos - CORRIGÉ */
        .logo-and-company {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .logo-container {
            display: table-cell;
            width: 150px;
            vertical-align: top;
        }
        
        .logo-container img {
            max-width: 120px;
            max-height: 80px;
            display: block;
        }
        
        .company-info {
            display: table-cell;
            text-align: right;
            vertical-align: top;
            padding-left: 20px;
        }
        
        .company-info div {
            margin: 2px 0;
        }
        
        .client-container {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
            text-align: right;
        }
        
        .client-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .client-container div {
            margin: 2px 0;
        }
        
        .devis-info-section {
            margin-top: 20px;
        }
        
        .devis-info-section div {
            margin: 5px 0;
        }
    </style>
</head>
<body>

<!-- EN-TÊTE PRINCIPAL -->
<div class="header">
    <!-- Logo et SK Attitude alignés horizontalement -->
    <div class="logo-and-company">
        <!-- Logo à gauche -->
        <div class="logo-container">
            <img src="{{ $config->logo }}" alt="Logo">
        </div>
        
        <!-- Informations SK Attitude alignées à droite -->
        <div class="company-info">
            <div class="company-name">{{ $config->nom }}</div>
            <div>{{ $config->adresse }}</div>
            <div>{{ $config->ville }}</div>
            <div>{{ $config->telephone_1 }} @if($config->telephone_2) - {{ $config->telephone_2 }} @endif</div>
        </div>
    </div>
    
    <!-- Client sous SK Attitude avec séparation -->
    <div class="client-container">
<div>{{ strtoupper($client->nom_societe) }}</div>
        <div>{{ $client->adresse }}</div>
<div>{{ strtoupper($client->ville) }}</div>
    </div>
</div>

<!-- Informations du devis en bas à gauche -->
<div class="devis-info-section">
    <div class="devis-title">DEVIS N° {{ $devis->numero_devis }}</div>
    <div><strong>Date du devis :</strong> {{ $devis->created_at->format('d/m/Y H:i:s') }}</div>
</div>

<!-- SEPARATEUR -->
<div class="separator"></div>

<!-- TABLEAU DES LIGNES -->
<table>
    <thead>
        <tr>
            <th class="description-col">Description</th>
            <th>Quantité</th>
            <th>Nbr jours</th>
            <th>Prix unitaire</th>
            <th>Taxes</th>
            <th class="price-col">Prix</th>
        </tr>
    </thead>
    <tbody>
        @foreach($devis->lignes as $ligne)
        <tr>
            <td class="description-col">{{ $ligne->description }}</td>
            <td>{{ number_format($ligne->quantite, 0, ',', ' ') }}</td>
            <td>{{ number_format($ligne->nombre_jours, 2, ',', ' ') }}</td>
            <td>{{ number_format($ligne->prix_unitaire, 2, ',', ' ') }} MAD</td>
            <td>TVA 20% VENTES</td>
            <td class="price-col">{{ number_format($ligne->total, 2, ',', ' ') }} MAD</td>
        </tr>
        @endforeach
    </tbody>
</table>

<!-- TOTALS -->
<div class="totals-section">
    <table class="totals-table">
        <tr>
            <td class="total-label">Total hors-taxe</td>
            <td class="total-value">{{ number_format($devis->sous_total, 2, ',', ' ') }} MAD</td>
        </tr>
        <tr>
            <td class="total-label">TVA 20% VENTES</td>
            <td class="total-value">{{ number_format($devis->tva, 2, ',', ' ') }} MAD</td>
        </tr>
        <tr>
            <td class="total-label"><strong>Total</strong></td>
            <td class="total-value"><strong>{{ number_format($devis->total_ttc, 2, ',', ' ') }} MAD</strong></td>
        </tr>
    </table>
</div>

<!-- FOOTER LEGALES -->
<div class="footer">
    <div class="footer-content">
        RC: {{ $config->RC ?? '383287' }} - 
        PATENTE: {{ $config->patente ?? '53601318' }} - 
        No TVA: {{ $config->TVA ?? '36366697' }} - 
        ICE: {{ $config->ICE ?? '003216889000028' }} - 
        CNSS: {{ $config->CNSS ?? '4658777' }}
    </div>
</div>

</body>
</html>