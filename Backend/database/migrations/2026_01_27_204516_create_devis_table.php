<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id'); // clé étrangère vers clients
            $table->string('numero_devis')->unique();
            $table->text('description')->nullable();
            $table->integer('quantite')->default(1);
            $table->integer('nombre_jours')->nullable();
            $table->decimal('prix_unitaire', 12, 2)->default(0);
            $table->decimal('taxe', 12, 2)->default(0);
            $table->decimal('sous_total', 12, 2)->default(0);
            $table->decimal('tva', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->string('condition_reglement')->nullable();
            $table->date('date_evenement')->nullable();
            $table->string('statut')->default('en_attente');
            $table->timestamps();

            // clé étrangère
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};
