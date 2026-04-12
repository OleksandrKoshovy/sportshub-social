import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/feed");
    } catch (err) {
      setError(err.message || "Nao foi possivel autenticar.");
    }
  };

  return (
    <section className="page form-page">
      <header className="section-header compact">
        <h1>Iniciar Sessao</h1>
        <p>Acede ao teu perfil para criar eventos e interagir com a comunidade.</p>
      </header>

      <form onSubmit={handleLogin} className="panel form-card">
        <label>
          Endereco de email
          <input
            type="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Palavra-passe
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="btn btn-primary">
          Login
        </button>

        <div className="form-footnote">
          <Link to="/register">Criar conta</Link>
          <a href="#" onClick={(event) => event.preventDefault()}>
            Recuperar palavra-passe
          </a>
        </div>
      </form>
    </section>
  );
}