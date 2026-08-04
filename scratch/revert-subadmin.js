const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eqsjhhpagpiyzhxzmjmd:howeduphpogiako123@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
async function revert() {
  await client.connect();
  console.log('✅ Reverting...');
  await client.query('UPDATE "User" SET role = \'FACULTY_COACH\' WHERE id = \'cmsett3vp001zurhzjjdib3qv\'');
  console.log('🔄 Reverted user role back to FACULTY_COACH.');
  await client.query('UPDATE "Event" SET "subAdminId" = 'cmqv00qtz000004lb5voks1v4' WHERE id = \'cmqdvjjn2000304i5a9z6xlsh\'');
  console.log('🔄 Reverted event subAdminId.');
  await client.end();
  console.log('🎉 Revert complete!');
}
revert().catch(console.error);
