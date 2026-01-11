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
        Schema::create('configurations', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
Schema::create('configurations', function (Blueprint $table) {
    $table->id();
    $table->string('logo')->nullable();
    $table->string('nom_entreprise');
    $table->string('adresse');
    $table->string('ville');
    $table->string('ice')->nullable();
    $table->string('rib')->nullable();
    $table->string('rc')->nullable();
    $table->string('tva')->nullable();
    $table->string('cnss')->nullable();
    $table->string('numero_tva')->nullable();
    $table->string('patente')->nullable();
    $table->string('telephone1')->nullable();
    $table->string('telephone2')->nullable();
    $table->string('email')->nullable();
    $table->timestamps();
});
    }
};
