import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventById, joinEvent } from "../services/api";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getEventById(id);
      setEvent(data || null);
    } catch (err) {
      setError(err.message || "Nao foi possivel carregar o evento.");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleJoin = async () => {
    await joinEvent(id);
    await load();
  };

  if (error) {
    return <section className="page"><p className="error-text">{error}</p></section>;
  }

  if (!event) {
    return <section className="page"><div className="panel empty-state">Evento nao encontrado.</div></section>;
  }

  return (
    <section className="page details-page">
      <header className="section-header">
        <h1>{event.title}</h1>
        <p>{event.sport || "Modalidade por definir"}</p>
      </header>

      <div className="panel details-grid">
        <div>
          <h3>Informacao principal</h3>
          <p><strong>Data:</strong> {event.date || "A confirmar"}</p>
          <p><strong>Hora:</strong> {event.time || "A confirmar"}</p>
          <p><strong>Localizacao:</strong> {event.location || "A confirmar"}</p>
          <p><strong>Descricao:</strong> {event.description || "Sem descricao"}</p>
        </div>

        <div>
          <h3>Participacao</h3>
          <p><strong>Inscritos:</strong> {event.participants || 0}</p>
          <p><strong>Maximo:</strong> {event.maxParticipants || "Sem limite"}</p>
          <button type="button" className="btn btn-primary" onClick={handleJoin}>
            Inscrever-me no evento
          </button>
        </div>
      </div>
    </section>
  );
}
