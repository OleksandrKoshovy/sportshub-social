import { Link } from "react-router-dom";

export default function EventCard({ event, onJoin }) {
	const participants = event.participants || 0;
	const max = Number(event.maxParticipants || 0);
	const slots = max > 0 ? Math.max(max - participants, 0) : "-";

	return (
		<article className="event-card">
			<div className="event-topline">
				<span className="chip">{event.sport || "Multidesporto"}</span>
				<span className="event-date">{event.date || "Data por definir"}</span>
			</div>

			<h3>{event.title}</h3>
			<p className="muted">{event.location || "Local a confirmar"}</p>
			<p className="muted">{event.description || "Sem descricao adicional."}</p>

			<div className="event-stats">
				<span>Participantes: {participants}</span>
				<span>Vagas: {slots}</span>
			</div>

			<div className="event-actions">
				<button type="button" className="btn btn-primary" onClick={onJoin}>
					Participar
				</button>
				<Link to={`/events/${event.id}`} className="btn btn-ghost">
					Ver detalhes
				</Link>
			</div>
		</article>
	);
}
