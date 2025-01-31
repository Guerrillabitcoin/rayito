const PLACEHOLDERS_NUM = 616

export default {
  Query: {
    registrationGrowth: async (parent, args, { models }) => {
      return await models.$queryRaw(
        `SELECT date_trunc('month', created_at) AS time, count("inviteId") as invited, count(*) - count("inviteId") as organic
        FROM users
        WHERE id > ${PLACEHOLDERS_NUM} AND date_trunc('month', now_utc()) <> date_trunc('month', created_at)
        GROUP BY time
        ORDER BY time ASC`)
    },
    activeGrowth: async (parent, args, { models }) => {
      return await models.$queryRaw(
        `SELECT date_trunc('month', created_at) AS time, count(DISTINCT "userId") as num
        FROM "ItemAct"
        WHERE date_trunc('month', now_utc()) <> date_trunc('month', created_at)
        GROUP BY time
        ORDER BY time ASC`)
    },
    itemGrowth: async (parent, args, { models }) => {
      return await models.$queryRaw(
        `SELECT date_trunc('month', created_at) AS time, count("parentId") as comments,
          count("subName") as jobs, count(*)-count("parentId")-count("subName") as posts
        FROM "Item"
        WHERE date_trunc('month', now_utc()) <> date_trunc('month', created_at)
        GROUP BY time
        ORDER BY time ASC`)
    },
    spentGrowth: async (parent, args, { models }) => {
      // add up earn for each month
      // add up non-self votes/tips for posts and comments

      return await models.$queryRaw(
        `SELECT date_trunc('month', "ItemAct".created_at) AS time,
        floor(sum(CASE WHEN act = 'STREAM' THEN "ItemAct".msats ELSE 0 END)/1000) as jobs,
        floor(sum(CASE WHEN act NOT IN ('BOOST', 'TIP', 'STREAM') THEN "ItemAct".msats ELSE 0 END)/1000) as fees,
        floor(sum(CASE WHEN act = 'BOOST' THEN "ItemAct".msats ELSE 0 END)/1000) as boost,
        floor(sum(CASE WHEN act = 'TIP' THEN "ItemAct".msats ELSE 0 END)/1000) as tips
        FROM "ItemAct"
        JOIN "Item" on "ItemAct"."itemId" = "Item".id
        WHERE date_trunc('month', now_utc()) <> date_trunc('month',  "ItemAct".created_at)
        GROUP BY time
        ORDER BY time ASC`)
    },
    earnerGrowth: async (parent, args, { models }) => {
      return await models.$queryRaw(
        `SELECT time, count(distinct user_id) as num
        FROM
        ((SELECT date_trunc('month', "ItemAct".created_at) AS time, "Item"."userId" as user_id
          FROM "ItemAct"
          JOIN "Item" on "ItemAct"."itemId" = "Item".id AND "Item"."userId" <> "ItemAct"."userId"
          WHERE date_trunc('month', now_utc()) <> date_trunc('month', "ItemAct".created_at))
        UNION ALL
        (SELECT date_trunc('month', created_at) AS time, "userId" as user_id
          FROM "Earn"
          WHERE date_trunc('month', now_utc()) <> date_trunc('month', created_at))) u
        GROUP BY time
        ORDER BY time ASC`)
    },
    stackedGrowth: async (parent, args, { models }) => {
      return await models.$queryRaw(
        `SELECT time, floor(sum(airdrop)/1000) as rewards, floor(sum(post)/1000) as posts, floor(sum(comment)/1000) as comments
        FROM
        ((SELECT date_trunc('month', "ItemAct".created_at) AS time, 0 as airdrop,
          CASE WHEN "Item"."parentId" IS NULL THEN 0 ELSE "ItemAct".msats END as comment,
          CASE WHEN "Item"."parentId" IS NULL THEN "ItemAct".msats ELSE 0 END as post
          FROM "ItemAct"
          JOIN "Item" on "ItemAct"."itemId" = "Item".id AND "Item"."userId" <> "ItemAct"."userId"
          WHERE date_trunc('month', now_utc()) <> date_trunc('month', "ItemAct".created_at) AND
          "ItemAct".act = 'TIP')
        UNION ALL
        (SELECT date_trunc('month', created_at) AS time, msats as airdrop, 0 as post, 0 as comment
          FROM "Earn"
          WHERE date_trunc('month', now_utc()) <> date_trunc('month', created_at))) u
        GROUP BY time
        ORDER BY time ASC`)
    },
    registrationsWeekly: async (parent, args, { models }) => {
      return await models.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    },
    activeWeekly: async (parent, args, { models }) => {
      const [{ active }] = await models.$queryRaw(
        `SELECT count(DISTINCT "userId") as active
        FROM "ItemAct"
        WHERE created_at >= now_utc() - interval '1 week'`
      )
      return active
    },
    earnersWeekly: async (parent, args, { models }) => {
      const [{ earners }] = await models.$queryRaw(
        `SELECT count(distinct user_id) as earners
        FROM
        ((SELECT "Item"."userId" as user_id
          FROM "ItemAct"
          JOIN "Item" on "ItemAct"."itemId" = "Item".id AND "Item"."userId" <> "ItemAct"."userId"
          WHERE "ItemAct".created_at >= now_utc() - interval '1 week')
        UNION ALL
        (SELECT "userId" as user_id
          FROM "Earn"
          WHERE created_at >= now_utc() - interval '1 week')) u`)
      return earners
    },
    itemsWeekly: async (parent, args, { models }) => {
      const [stats] = await models.$queryRaw(
        `SELECT json_build_array(
          json_build_object('name', 'comments', 'value', count("parentId")),
          json_build_object('name', 'jobs', 'value', count("subName")),
          json_build_object('name', 'posts', 'value', count(*)-count("parentId")-count("subName"))) as array
        FROM "Item"
        WHERE created_at >= now_utc() - interval '1 week'`)

      return stats?.array
    },
    spentWeekly: async (parent, args, { models }) => {
      const [stats] = await models.$queryRaw(
        `SELECT json_build_array(
          json_build_object('name', 'jobs', 'value', floor(sum(CASE WHEN act = 'STREAM' THEN "ItemAct".msats ELSE 0 END)/1000)),
          json_build_object('name', 'fees', 'value', floor(sum(CASE WHEN act NOT IN ('BOOST', 'TIP', 'STREAM') THEN "ItemAct".msats ELSE 0 END)/1000)),
          json_build_object('name', 'boost', 'value',floor(sum(CASE WHEN act = 'BOOST' THEN "ItemAct".msats ELSE 0 END)/1000)),
          json_build_object('name', 'tips', 'value', floor(sum(CASE WHEN act = 'TIP' THEN "ItemAct".msats ELSE 0 END)/1000))) as array
        FROM "ItemAct"
        JOIN "Item" on "ItemAct"."itemId" = "Item".id
        WHERE "ItemAct".created_at >= now_utc() - interval '1 week'`)

      return stats?.array
    },
    stackedWeekly: async (parent, args, { models }) => {
      const [stats] = await models.$queryRaw(
        `SELECT json_build_array(
          json_build_object('name', 'rewards', 'value', floor(sum(airdrop)/1000)),
          json_build_object('name', 'posts', 'value', floor(sum(post)/1000)),
          json_build_object('name', 'comments', 'value', floor(sum(comment)/1000))
        ) as array
        FROM
        ((SELECT 0 as airdrop,
          CASE WHEN "Item"."parentId" IS NULL THEN 0 ELSE "ItemAct".msats END as comment,
          CASE WHEN "Item"."parentId" IS NULL THEN "ItemAct".msats ELSE 0 END as post
          FROM "ItemAct"
          JOIN "Item" on "ItemAct"."itemId" = "Item".id AND "Item"."userId" <> "ItemAct"."userId"
          WHERE  "ItemAct".created_at >= now_utc() - interval '1 week' AND
          "ItemAct".act = 'TIP')
        UNION ALL
        (SELECT msats as airdrop, 0 as post, 0 as comment
          FROM "Earn"
          WHERE  created_at >= now_utc() - interval '1 week')) u`)

      return stats?.array
    }
  }
}
