#!/usr/bin/env node

import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - using test file
const POCKETBASE_URL = 'http://localhost:8090';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Password123';
const TSV_FILE = path.join(__dirname, '../questions-test.tsv');
const BATCH_SIZE = 5; // Very small batches for testing

// Initialize PocketBase
const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation to handle long-running operations
pb.autoCancellation(false);

async function authenticate() {
  try {
    console.log('🔐 Authenticating with PocketBase...');
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

async function parseTSV(filePath) {
  try {
    console.log('📖 Reading TSV file...');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('TSV file is empty');
    }

    const headers = lines[0].split('\t');
    console.log(`📊 Found ${headers.length} columns: ${headers.join(', ')}`);

    const questions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length !== headers.length) {
        console.warn(`⚠️  Line ${i + 1} has ${values.length} values but expected ${headers.length}, skipping...`);
        continue;
      }

      const question = {};
      headers.forEach((header, index) => {
        question[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
      });

      questions.push(question);
    }

    console.log(`✅ Parsed ${questions.length} questions from TSV`);
    return questions;
  } catch (error) {
    console.error('❌ Failed to parse TSV:', error.message);
    return [];
  }
}

async function getExistingExternalIds() {
  try {
    console.log('🔍 Checking for existing questions...');

    // Get all existing external_ids
    const existingRecords = await pb.collection('questions').getFullList({
      fields: 'external_id',
      filter: 'external_id != ""'
    });

    const existingIds = new Set(existingRecords.map(record => record.external_id));
    console.log(`📊 Found ${existingIds.size} existing questions in database`);

    return existingIds;
  } catch (error) {
    console.error('❌ Failed to get existing questions:', error.message);
    return new Set();
  }
}

async function importQuestions(questions, existingIds) {
  try {
    console.log('📥 Starting import test...');

    // Filter out questions that already exist
    const newQuestions = questions.filter(q => q.id && !existingIds.has(q.id));
    console.log(`📊 ${newQuestions.length} new questions to import (${questions.length - newQuestions.length} already exist)`);

    if (newQuestions.length === 0) {
      console.log('✅ No new questions to import');
      return { success: true, imported: 0, skipped: questions.length };
    }

    let imported = 0;
    let skipped = 0;

    // Process in batches
    for (let i = 0; i < newQuestions.length; i += BATCH_SIZE) {
      const batch = newQuestions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(newQuestions.length / BATCH_SIZE);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);

      // Process questions sequentially to avoid overwhelming the server
      const batchResults = [];
      for (const question of batch) {
        try {
          const recordData = {
            external_id: question.id,
            category: question.category || '',
            subcategory: question.subcategory || '',
            difficulty: question.difficulty || 'medium',
            question: question.question || '',
            answer_a: question.a || '',
            answer_b: question.b || '',
            answer_c: question.c || '',
            answer_d: question.d || '',
            level: question.level || '',
            metadata: question.metadata || ''
          };

          await pb.collection('questions').create(recordData);
          batchResults.push({ success: true });
        } catch (error) {
          if (error.status === 400 && error.data?.data?.external_id?.code === 'validation_not_unique') {
            // This shouldn't happen with our pre-filtering, but handle it gracefully
            batchResults.push({ success: false, reason: 'duplicate', questionId: question.id });
          } else {
            console.error(`❌ Failed to import question ${question.id}:`, error.message);
            batchResults.push({ success: false, reason: 'error', questionId: question.id, error: error.message });
          }
        }

        // Small delay between each request to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      batchResults.forEach(result => {
        if (result.success) {
          imported++;
        } else {
          skipped++;
          if (result.reason !== 'duplicate') {
            console.error(`❌ Import failed for question ${result.questionId}: ${result.error}`);
          }
        }
      });

      console.log(`✅ Batch ${batchNumber} completed: ${batchResults.filter(r => r.success).length} imported, ${batchResults.filter(r => !r.success).length} skipped`);

      // Small delay between batches to let the server breathe
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🎉 Import test completed: ${imported} questions imported, ${skipped} skipped`);
    return { success: true, imported, skipped };
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return { success: false, imported: 0, skipped: 0, error: error.message };
  }
}

async function main() {
  console.log('🧪 Starting PocketBase questions import test...\n');

  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    process.exit(1);
  }

  // Parse TSV
  const questions = await parseTSV(TSV_FILE);
  if (questions.length === 0) {
    console.log('❌ No questions to import');
    process.exit(1);
  }

  // Get existing IDs to prevent duplicates
  const existingIds = await getExistingExternalIds();

  // Import questions
  const result = await importQuestions(questions, existingIds);

  if (result.success) {
    console.log('\n🎊 Test import completed successfully!');
    console.log(`📈 Summary: ${result.imported} imported, ${result.skipped} skipped`);
  } else {
    console.error('\n💥 Test import failed:', result.error);
    process.exit(1);
  }
}

// Run the test script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});