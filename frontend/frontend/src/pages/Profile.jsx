export default function Profile() {
  return (
    <section className="page">
      <header className="section-header compact">
        <h1>Perfil do Utilizador</h1>
        <p>Consulta os teus dados, desportos preferidos e historico de participacao.</p>
      </header>

      <div className="cards-grid">
        <article className="panel">
          <h3>Dados pessoais</h3>
          <p>Nome de utilizador: atleta_01</p>
          <p>Nome completo: Utilizador Demo</p>
          <p>Cidade: Lisboa</p>
        </article>

        <article className="panel">
          <h3>Desportos preferidos</h3>
          <p>Padel, Corrida, Futebol</p>
        </article>

        <article className="panel">
          <h3>Resumo de atividade</h3>
          <p>Eventos criados: 6</p>
          <p>Eventos participados: 21</p>
          <p>Avaliacao media: 4.7/5</p>
        </article>
      </div>
    </section>
  );
}
