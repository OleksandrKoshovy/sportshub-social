const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, myTimer) {
  const now = new Date().toISOString();
  context.log(`[CleanupExpired] Iniciado em ${now}`);

  const client   = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database(process.env.COSMOS_DATABASE || 'sportshub');
  const eventsContainer         = database.container('events');
  const participationsContainer = database.container('participations');
  const usersContainer          = database.container('users');

  try {
    // 1. Buscar eventos activos cuja data já passou
    const { resources: expiredEvents } = await eventsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.status = "active" AND c.dateTime < @now',
        parameters: [{ name: '@now', value: now }],
      })
      .fetchAll();

    context.log(`[CleanupExpired] ${expiredEvents.length} eventos expirados encontrados.`);

    let eventsUpdated = 0;
    let usersUpdated  = 0;

    for (const event of expiredEvents) {
      // 2. Marcar evento como concluído
      await eventsContainer.item(event.id, event.id).replace({
        ...event,
        status:    'completed',
        updatedAt: now,
      });
      eventsUpdated++;

      // 3. Buscar todos os participantes deste evento
      const { resources: participations } = await participationsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.eventId = @eid',
          parameters: [{ name: '@eid', value: event.id }],
        })
        .fetchAll();

      // 4. Incrementar eventsCount de cada participante
      for (const part of participations) {
        const { resources: userList } = await usersContainer.items
          .query({
            query: 'SELECT * FROM c WHERE c.id = @uid',
            parameters: [{ name: '@uid', value: part.userId }],
          })
          .fetchAll();

        if (!userList[0]) continue;
        const user = userList[0];

        const eventsCount   = (user.eventsCount || 0) + 1;
        const avgRating     = user.avgRating || 0;
        const rankingPoints = Math.round(avgRating * 20) + eventsCount * 5;

        await usersContainer.item(user.id, user.id).replace({
          ...user,
          eventsCount,
          rankingPoints,
          updatedAt: now,
        });
        usersUpdated++;
      }
    }

    context.log(`[CleanupExpired] ✓ ${eventsUpdated} eventos concluídos, ${usersUpdated} utilizadores actualizados.`);

  } catch (err) {
    context.log.error('[CleanupExpired] Erro:', err.message);
    throw err;
  }
};
