import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/api";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    sport: "",
    location: "",
    date: "",
    time: "",
    maxParticipants: "",
    description: "",
  });
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await createEvent(form);
      navigate("/feed");
    } catch (err) {
      setError(err.message || "Nao foi possivel criar o evento.");
    }
  };

  return (
    <section className="page form-page">
      <header className="section-header compact">
        <h1>Criar Evento</h1>
        <p>Organiza uma atividade desportiva e abre vagas para a comunidade.</p>
      </header>

      <form className="panel form-card" onSubmit={handleSubmit}>
        <label>
          Nome do evento
          <input value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
        </label>

        <div className="split-grid">
          <label>
            Modalidade
            <input value={form.sport} onChange={(event) => updateField("sport", event.target.value)} placeholder="Ex: Padel" required />
          </label>

          <label>
            Localizacao
            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} required />
          </label>
        </div>

        <div className="triple-grid">
          <label>
            Data
            <input type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required />
          </label>

          <label>
            Hora
            <input type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} required />
          </label>

          <label>
            Maximo participantes
            <input
              type="number"
              min="2"
              value={form.maxParticipants}
              onChange={(event) => updateField("maxParticipants", event.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Descricao
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Objetivo, nivel, material necessario..."
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="btn btn-primary">
          Publicar evento
        </button>
      </form>
    </section>
  );
}