const { CosmosClient } = require('@azure/cosmos');

/**
 * Azure Function: UpdateRanking
 *
 * Trigger: HTTP POST ou Event Grid (após conclusão de evento)
 * Objetivo: Recalcular a avaliação média e os pontos de ranking
 *           do utilizador avaliado, com base em todas as suas ratings.
 */
module.exports = async function (context, req) {
  context.log('[UpdateRanking] Function iniciada.');

  const { eventId, ratedUserId } = req.body || {};

  if (!ratedUserId) {
    context.res = { status: 400, body: { error: 'ratedUserId é obrigatório.' } };
    return;
  }

  const client   = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database(process.env.COSMOS_DATABASE || 'sportshub');
  const ratingsContainer = database.container('ratings');
  const usersContainer   = database.container('users');

  try {
    // 1. Buscar todas as avaliações recebidas pelo utilizador
    const { resources: allRatings } = await ratingsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.ratedId = @uid',
        parameters: [{ name: '@uid', value: ratedUserId }],
      })
      .fetchAll();

    context.log(`[UpdateRanking] ${allRatings.length} avaliações encontradas para userId: ${ratedUserId}`);

    if (allRatings.length === 0) {
      context.res = { status: 200, body: { message: 'Sem avaliações para processar.' } };
      return;
    }

    // 2. Calcular nova média e contagem de eventos únicos
    const totalScore  = allRatings.reduce((sum, r) => sum + r.score, 0);
    const avgRating   = parseFloat((totalScore / allRatings.length).toFixed(2));
    const uniqueEvents = [...new Set(allRatings.map(r => r.eventId))].length;

    // 3. Calcular pontos de ranking
    //    Fórmula: (avgRating * 50) + (eventsCount * 10) + (totalRatings * 2)
    const rankingPoints = Math.round(
      (avgRating * 50) + (uniqueEvents * 10) + (allRatings.length * 2)
    );

    // 4. Atualizar o documento do utilizador no Cosmos DB
    const { resources: users } = await usersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: ratedUserId }],
      })
      .fetchAll();

    if (!users.length) {
      context.log(`[UpdateRanking] Utilizador ${ratedUserId} não encontrado.`);
      context.res = { status: 404, body: { error: 'Utilizador não encontrado.' } };
      return;
    }

    const user = users[0];
    const updatedUser = {
      ...user,
      avgRating,
      eventsCount:   uniqueEvents,
      rankingPoints,
      updatedAt:     new Date().toISOString(),
    };

    await usersContainer.item(user.id, user.id).replace(updatedUser);

    context.log(`[UpdateRanking] ✓ userId: ${ratedUserId} | avgRating: ${avgRating} | pts: ${rankingPoints}`);

    context.res = {
      status: 200,
      body: {
        userId:        ratedUserId,
        avgRating,
        eventsCount:   uniqueEvents,
        rankingPoints,
        ratingsCount:  allRatings.length,
      },
    };

  } catch (err) {
    context.log.error('[UpdateRanking] Erro:', err.message);
    context.res = { status: 500, body: { error: err.message } };
  }
};
