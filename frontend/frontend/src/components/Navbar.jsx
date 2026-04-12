import { NavLink } from "react-router-dom";

const links = [
	{ to: "/", label: "Landing" },
	{ to: "/feed", label: "Eventos" },
	{ to: "/create", label: "Criar" },
	{ to: "/ranking", label: "Ranking" },
	{ to: "/profile", label: "Perfil" },
	{ to: "/admin", label: "Admin" },
];

export default function Navbar() {
	return (
		<header className="navbar">
			<NavLink to="/" className="brand">
				<span className="brand-dot" aria-hidden>
					S
				</span>
				SportsHub Social
			</NavLink>

			<nav className="nav-links" aria-label="Navegacao principal">
				{links.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							isActive ? "nav-link nav-link-active" : "nav-link"
						}
					>
						{item.label}
					</NavLink>
				))}
			</nav>

			<div className="nav-actions">
				<NavLink to="/login" className="btn btn-ghost">
					Entrar
				</NavLink>
				<NavLink to="/register" className="btn btn-primary">
					Registar
				</NavLink>
			</div>
		</header>
	);
}
