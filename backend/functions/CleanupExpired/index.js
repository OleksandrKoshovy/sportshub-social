const { CosmosClient } = require('@azure/cosmos');

/**
 * Azure Function: CleanupExpired
 *
 * Trigger: Timer — executa todos os dias à meia-noite (UTC)
 * Objetivo: Marcar como "completed" todos os eventos cuja
 *           data/hora de realização já passou.
 */
module.exports = async function (context, myTimer) {
  const now = new Date().toISOString();
  context.log(`[CleanupExpired] Iniciado em ${now}`);

  const client   = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database(process.env.COSMOS_DATABASE || 'sportshub');
  const eventsContainer = database.container('events');

  try {
    // Buscar eventos activos cuja data já passou
    const { resources: expiredEvents } = await eventsContainer.items
      .query({
        query: `SELECT * FROM c
                WHERE c.status = "active"
                AND c.dateTime < @now`,
        parameters: [{ name: '@now', value: now }],
      })
      .fetchAll();

    context.log(`[CleanupExpired] ${expiredEvents.length} eventos expirados encontrados.`);

    let updated = 0;
    for (const event of expiredEvents) {
      await eventsContainer.item(event.id, event.id).replace({
        ...event,
        status:    'completed',
        updatedAt: now,
      });
      updated++;
    }

    context.log(`[CleanupExpired] ✓ ${updated} eventos marcados como concluídos.`);

  } catch (err) {
    context.log.error('[CleanupExpired] Erro:', err.message);
    throw err;
  }
};
