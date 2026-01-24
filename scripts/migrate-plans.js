
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase-admin/firestore');
const { normalizePlan, SubscriptionType } = require('../src/lib/subscription.js');

// --- CONFIGURATION ---

// IMPORTANT: Ensure you have the service account credentials in your environment
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const appId = 'solos-web'; // Or retrieve dynamically if needed

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('Running in --dry-run mode. No actual changes will be made.');
}

// --- MIGRATION SCRIPT ---

async function migrateUserPlans() {
  console.log('Starting user plan migration...');

  const usersRef = collection(db, 'artifacts', appId, 'users');
  const usersSnapshot = await getDocs(usersRef);

  if (usersSnapshot.empty) {
    console.log('No users found to migrate.');
    return;
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userProfileRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'profile');

    const userProfileSnapshot = await userProfileRef.get();
    if (!userProfileSnapshot.exists()) {
      console.log(`- User ${userId} has no profile, skipping.`);
      skippedCount++;
      continue;
    }

    const profileData = userProfileSnapshot.data();
    const currentPlan = profileData.tier || profileData.plan;

    if (!currentPlan) {
      console.log(`- User ${userId} has no plan, skipping.`);
      skippedCount++;
      continue;
    }

    const normalizedPlan = normalizePlan(currentPlan);

    if (normalizedPlan === currentPlan) {
      console.log(`- User ${userId}'s plan is already normalized ('${currentPlan}'), skipping.`);
      skippedCount++;
      continue;
    }

    console.log(`- User ${userId} needs migration: '${currentPlan}' -> '${normalizedPlan}'`);

    if (!isDryRun) {
      try {
        await setDoc(userProfileRef, { tier: normalizedPlan, plan: normalizedPlan }, { merge: true });
        console.log(`  - Successfully migrated user ${userId}.`);
        migratedCount++;
      } catch (error) {
        console.error(`  - Failed to migrate user ${userId}:`, error);
      }
    } else {
      migratedCount++; // In dry run, we count it as a "would-be" migration
    }
  }

  console.log('\nMigration summary:');
  console.log(`- ${migratedCount} users processed for migration.`);
  console.log(`- ${skippedCount} users skipped (no plan or already normalized).`);
  
  if (isDryRun) {
    console.log('\nDry run complete. No data was changed.');
  }
}

migrateUserPlans().catch(error => {
  console.error('An unexpected error occurred during migration:', error);
});
h