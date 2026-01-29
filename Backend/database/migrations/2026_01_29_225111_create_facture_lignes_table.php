<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('facture_lignes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('facture_id')->constrained()->onDelete('cascade');
    $table->string('description');
    $table->integer('quantite');
    $table->integer('nombre_jours');
    $table->decimal('prix_unitaire', 15, 2);
    $table->decimal('tva', 5, 2);
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
