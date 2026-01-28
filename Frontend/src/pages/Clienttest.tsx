import { useEffect, useState } from "react";
import axios from "axios";

// types.ts
export interface Client {
  id: number;
  nom_societe: string;
  adresse: string;
  ville: string;
  pays: string;
  ice: string;
  telephone: string;
  email: string;
  created_at: string;
  updated_at: string;
}


const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get<Client[]>("http://127.0.0.1:8000/api/clients") // typage de la réponse
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Liste des clients</h1>
      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom Société</th>
            <th>Adresse</th>
            <th>Ville</th>
            <th>Pays</th>
            <th>ICE</th>
            <th>Téléphone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.id}</td>
              <td>{client.nom_societe}</td>
              <td>{client.adresse}</td>
              <td>{client.ville}</td>
              <td>{client.pays}</td>
              <td>{client.ice}</td>
              <td>{client.telephone}</td>
              <td>{client.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Clients;
