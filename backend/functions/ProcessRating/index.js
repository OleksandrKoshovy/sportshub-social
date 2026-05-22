const { CosmosClient } = require('@azure/cosmos');

/**
 * Azure Function: ProcessRating
 *
 * Trigger: Cosmos DB Change Feed — dispara automaticamente
 *          cada vez que um novo documento é inserido no
 *          container "ratings".
 *
 * Objetivo: Recalcular avgRating e rankingPoints do utilizador
 *           avaliado, sem necessidade de chamada manual.
 */
module.exports = async function (context, documents) {
  if (!documents || documents.length === 0) {
    context.log('[ProcessRating] Sem documentos novos.');
    return;
  }

  context.log(`[ProcessRating] ${documents.length} nova(s) avaliação(ões) a processar.`);

  const client   = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database(process.env.COSMOS_DATABASE || 'sportshub');
  const ratingsContainer = database.container('ratings');
  const usersContainer   = database.container('users');

  // Obter lista de utilizadores únicos que foram avaliados
  const ratedIds = [...new Set(documents.map(d => d.ratedId).filter(Boolean))];
  context.log(`[ProcessRating] Utilizadores a atualizar: ${ratedIds.join(', ')}`);

  for (const ratedId of ratedIds) {
    try {
      // 1. Buscar todas as avaliações recebidas por este utilizador
      const { resources: allRatings } = await ratingsContainer.items
        .query({
          query: 'SELECT c.score, c.eventId FROM c WHERE c.ratedId = @uid',
          parameters: [{ name: '@uid', value: ratedId }],
        })
        .fetchAll();

      if (allRatings.length === 0) continue;

      // 2. Calcular média de avaliações
      const totalScore  = allRatings.reduce((sum, r) => sum + r.score, 0);
      const avgRating   = Math.round((totalScore / allRatings.length) * 10) / 10;

      // 3. Buscar o utilizador atual
      const { resources: users } = await usersContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: ratedId }],
        })
        .fetchAll();

      if (!users.length) {
        context.log.warn(`[ProcessRating] Utilizador ${ratedId} não encontrado.`);
        continue;
      }

      const user = users[0];

      // 4. Calcular pontos de ranking
      //    Fórmula: (avgRating * 20) + (eventsCount * 5)
      const rankingPoints = Math.round(avgRating * 20) + (user.eventsCount || 0) * 5;

      // 5. Atualizar utilizador no Cosmos DB
      await usersContainer.item(user.id, user.id).replace({
        ...user,
        avgRating,
        rankingPoints,
        updatedAt: new Date().toISOString(),
      });

      context.log(
        `[ProcessRating] ✓ ${user.username} | avgRating: ${avgRating} | pontos: ${rankingPoints}`
      );

    } catch (err) {
      context.log.error(`[ProcessRating] Erro ao processar ${ratedId}:`, err.message);
    }
  }

  context.log('[ProcessRating] Concluído.');
};
