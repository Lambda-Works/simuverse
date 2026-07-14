/**
 * One-shot: import local users into Firebase Auth with bcrypt hashes,
 * then set users.firebase_uid.
 *
 * Usage (from apps/api-nest):
 *   npx ts-node src/scripts/migrate-users-to-firebase.ts
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { UserImportRecord, getAuth } from 'firebase-admin/auth';

const prisma = new PrismaClient();

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_* env vars');
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const users = await prisma.user.findMany({
    where: { password_hash: { not: null }, is_active: true },
  });

  console.log(`Migrating ${users.length} users to Firebase project ${projectId}...`);

  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const importUsers: UserImportRecord[] = batch
      .filter((u) => !!u.password_hash)
      .map((u) => ({
        uid: u.firebase_uid || u.id,
        email: u.email,
        displayName: u.name,
        passwordHash: Buffer.from(u.password_hash as string),
        emailVerified: true,
      }));

    const result = await getAuth().importUsers(importUsers, {
      hash: { algorithm: 'BCRYPT' },
    });

    console.log(
      `Batch ${i / batchSize + 1}: success=${result.successCount} failure=${result.failureCount}`,
    );
    if (result.errors?.length) {
      for (const err of result.errors) {
        console.error(`  idx ${err.index}: ${err.error.message}`);
      }
    }

    for (const u of batch) {
      const uid = u.firebase_uid || u.id;
      await prisma.user.update({
        where: { id: u.id },
        data: { firebase_uid: uid },
      });
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
