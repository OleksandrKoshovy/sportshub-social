const ranking = [
  { name: "Rita Gomes", events: 42, rating: 4.9 },
  { name: "Miguel Costa", events: 38, rating: 4.8 },
  { name: "Diana Faria", events: 34, rating: 4.7 },
  { name: "Joao Ramos", events: 29, rating: 4.6 },
];

export default function Ranking() {
  return (
    <section className="page">
      <header className="section-header compact">
        <h1>Ranking de Jogadores</h1>
        <p>Classificacao baseada em participacoes e avaliacao media.</p>
      </header>

      <div className="panel ranking-table-wrap">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posicao</th>
              <th>Utilizador</th>
              <th>Eventos</th>
              <th>Avaliacao media</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((player, index) => (
              <tr key={player.name}>
                <td>#{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.events}</td>
                <td>{player.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
