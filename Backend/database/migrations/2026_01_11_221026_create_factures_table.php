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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
Schema::create('factures', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('client_id');
    $table->unsignedBigInteger('devis_id')->nullable(); // référence au devis
    $table->string('numero')->unique(); // FAC/2026/0001
    $table->date('date_facture'); // création
    $table->date('date_echeance'); 
    $table->decimal('total_ttc', 10, 2);
    $table->string('status')->default('impayé'); // impayé, payé, en_retard
    $table->timestamps();

    $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
    $table->foreign('devis_id')->references('id')->on('devis')->onDelete('set null');
});


    }
};
