const users = [
  { id: "u1", name: "Rui Cardoso", status: "Ativo" },
  { id: "u2", name: "Paula Simas", status: "Suspenso" },
  { id: "u3", name: "Andre Mota", status: "Ativo" },
];

const events = [
  { id: "e1", title: "Torneio Relampago", status: "Ativo" },
  { id: "e2", title: "Partida Amigavel", status: "Revisao" },
  { id: "e3", title: "Treino Noturno", status: "Ativo" },
];

export default function Admin() {
  return (
    <section className="page">
      <header className="section-header compact">
        <h1>Administracao</h1>
        <p>Area reservada para moderacao de utilizadores e eventos.</p>
      </header>

      <div className="admin-grid">
        <article className="panel">
          <h3>Gestao de utilizadores</h3>
          <ul className="list-reset">
            {users.map((user) => (
              <li key={user.id} className="row-space">
                <span>{user.name}</span>
                <span className="chip">{user.status}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Gestao de eventos</h3>
          <ul className="list-reset">
            {events.map((event) => (
              <li key={event.id} className="row-space">
                <span>{event.title}</span>
                <span className="chip">{event.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
