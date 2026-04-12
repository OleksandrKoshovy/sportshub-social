import { useEffect, useState } from "react";
import { getEvents, joinEvent } from "../services/api";
import EventCard from "../components/EventCard";

const sorters = {
  recentes: (a, b) => Number(b.id) - Number(a.id),
  proximos: (a, b) => (a.date || "").localeCompare(b.date || ""),
  popular: (a, b) => (b.participants || 0) - (a.participants || 0),
  vagas: (a, b) => (b.maxParticipants || 0) - (b.participants || 0) - ((a.maxParticipants || 0) - (a.participants || 0)),
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recentes");

  const loadEvents = async () => {
    const data = await getEvents();
    setEvents(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const sports = [...new Set(events.map((event) => event.sport).filter(Boolean))];

  const filteredEvents = events
    .filter((event) => {
      const text = `${event.title || ""} ${event.location || ""} ${event.sport || ""}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesSport = sportFilter === "all" || event.sport === sportFilter;
      return matchesQuery && matchesSport;
    })
    .sort(sorters[sortBy]);

  const handleJoin = async (id) => {
    await joinEvent(id);
    await loadEvents();
  };

  return (
    <section className="page">
      <header className="section-header">
        <h1>Feed de Eventos</h1>
        <p>Descobre atividades desportivas, filtra por modalidade e participa num clique.</p>
      </header>

      <div className="panel filters-grid">
        <label>
          Pesquisa
          <input
            type="text"
            placeholder="Ex: padel, Lisboa, treino"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label>
          Modalidade
          <select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
            <option value="all">Todas</option>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ordenacao
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="proximos">Mais proximos</option>
            <option value="popular">Mais participantes</option>
            <option value="vagas">Mais vagas</option>
          </select>
        </label>
      </div>

      <div className="cards-grid">
        {filteredEvents.length === 0 ? (
          <div className="panel empty-state">Ainda nao ha eventos para mostrar.</div>
        ) : (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onJoin={() => handleJoin(event.id)} />
          ))
        )}
      </div>
    </section>
  );
}