let events = [];

exports.getEvents = (req, res) => {
  res.json(events);
};

exports.createEvent = (req, res) => {
  const newEvent = {
    id: Date.now().toString(),
    title: req.body.title,
    location: req.body.location,
  };

  events.push(newEvent);

  res.status(201).json(newEvent);
};

exports.joinEvent = (req, res) => {
  const { id } = req.params;

  const event = events.find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (!event.participants) {
    event.participants = 0;
  }

  event.participants += 1;

  res.json(event);
};