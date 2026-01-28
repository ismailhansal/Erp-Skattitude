<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bon_livraisons', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique(); // BL incrémental
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('devis_id')->nullable()->constrained()->onDelete('set null');
            $table->text('description');
            $table->integer('quantite')->default(1);
            $table->integer('nombre_jours')->default(1);
            $table->date('date_creation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bon_livraisons');
    }
};
