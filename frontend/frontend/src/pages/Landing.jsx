import { Link } from "react-router-dom";

const highlightEvents = [
  {
    title: "Treino Aberto de Padel",
    location: "Lisboa",
    sport: "Padel",
  },
  {
    title: "5K Sunset Run",
    location: "Porto",
    sport: "Corrida",
  },
  {
    title: "Basket Pickup Night",
    location: "Coimbra",
    sport: "Basquetebol",
  },
];

export default function Landing() {
  return (
    <section className="page landing-page">
      <div className="hero-band panel">
        <div>
          <p className="eyebrow">Comunidade desportiva local</p>
          <h1>Joga mais. Conhece pessoas. Cria eventos em minutos.</h1>
          <p>
            O SportsHub Social junta atletas amadores e organizadores num unico
            espaco. Descobre jogos perto de ti e participa de forma simples.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">
              Criar conta
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Iniciar sessao
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>420+</strong>
            <span>Utilizadores ativos</span>
          </div>
          <div>
            <strong>98</strong>
            <span>Eventos este mes</span>
          </div>
          <div>
            <strong>14</strong>
            <span>Modalidades</span>
          </div>
        </div>
      </div>

      <section className="section-block">
        <header className="section-header compact">
          <h2>Eventos em destaque</h2>
        </header>
        <div className="cards-grid">
          {highlightEvents.map((event) => (
            <article className="event-card" key={event.title}>
              <span className="chip">{event.sport}</span>
              <h3>{event.title}</h3>
              <p className="muted">{event.location}</p>
              <Link className="btn btn-ghost" to="/register">
                Quero participar
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits-grid">
        <article className="panel">
          <h3>Organiza sem friccao</h3>
          <p>Cria eventos com vagas, data, local e descricao detalhada.</p>
        </article>
        <article className="panel">
          <h3>Encontra pessoas com o teu ritmo</h3>
          <p>Filtra por modalidade, localizacao e disponibilidade.</p>
        </article>
        <article className="panel">
          <h3>Cresce no ranking</h3>
          <p>Participa, recebe avaliacoes e acompanha o teu desempenho.</p>
        </article>
      </section>
    </section>
  );
}
