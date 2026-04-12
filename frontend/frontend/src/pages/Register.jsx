import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

const availableSports = ["Futebol", "Padel", "Corrida", "Basquetebol", "Voleibol", "Tenis"];

export default function Register() {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		username: "",
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
		city: "",
		sports: [],
	});
	const [error, setError] = useState("");

	const canSubmit = useMemo(() => {
		return (
			form.username &&
			form.fullName &&
			form.email &&
			form.password &&
			form.confirmPassword &&
			form.password === form.confirmPassword
		);
	}, [form]);

	const updateField = (key, value) => {
		setForm((current) => ({ ...current, [key]: value }));
	};

	const toggleSport = (sport) => {
		setForm((current) => {
			const alreadySelected = current.sports.includes(sport);
			return {
				...current,
				sports: alreadySelected
					? current.sports.filter((item) => item !== sport)
					: [...current.sports, sport],
			};
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (form.password !== form.confirmPassword) {
			setError("As palavras-passe nao coincidem.");
			return;
		}

		try {
			await register(form);
			navigate("/login");
		} catch (err) {
			setError(err.message || "Falha no registo.");
		}
	};

	return (
		<section className="page form-page">
			<header className="section-header compact">
				<h1>Criar Conta</h1>
				<p>Entra na comunidade SportsHub e encontra parceiros para jogar.</p>
			</header>

			<form className="panel form-card" onSubmit={handleSubmit}>
				<label>
					Nome de utilizador
					<input value={form.username} onChange={(event) => updateField("username", event.target.value)} required />
				</label>

				<label>
					Nome completo
					<input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} required />
				</label>

				<label>
					Endereco de email
					<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
				</label>

				<div className="split-grid">
					<label>
						Palavra-passe
						<input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required />
					</label>

					<label>
						Confirmar palavra-passe
						<input
							type="password"
							value={form.confirmPassword}
							onChange={(event) => updateField("confirmPassword", event.target.value)}
							required
						/>
					</label>
				</div>

				<label>
					Cidade / localizacao
					<input value={form.city} onChange={(event) => updateField("city", event.target.value)} />
				</label>

				<fieldset className="sports-picker">
					<legend>Desportos de interesse</legend>
					<div className="chip-wrap">
						{availableSports.map((sport) => {
							const active = form.sports.includes(sport);
							return (
								<button
									key={sport}
									type="button"
									onClick={() => toggleSport(sport)}
									className={active ? "chip chip-active" : "chip"}
								>
									{sport}
								</button>
							);
						})}
					</div>
				</fieldset>

				{error ? <p className="error-text">{error}</p> : null}

				<button className="btn btn-primary" type="submit" disabled={!canSubmit}>
					Registar
				</button>

				<p className="form-footnote single">
					Ja tens conta? <Link to="/login">Entrar</Link>
				</p>
			</form>
		</section>
	);
}
