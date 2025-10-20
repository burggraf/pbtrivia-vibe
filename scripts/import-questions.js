#!/usr/bin/env node

import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const POCKETBASE_URL = 'http://localhost:8090';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Password123';
const TSV_FILE = path.join(__dirname, '../questions.tsv');
const BATCH_SIZE = 1000; // Process questions in larger batches for faster import

// Initialize PocketBase
const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation to handle long-running operations
pb.autoCancellation(false);

// Questions collection schema
const questionsSchema = {
  name: "questions",
  type: "base",
  schema: [
    {
      name: "external_id",
      type: "text",
      required: false,
      unique: true
    },
    {
      name: "category",
      type: "text",
      required: false
    },
    {
      name: "subcategory",
      type: "text",
      required: false
    },
    {
      name: "difficulty",
      type: "select",
      required: true,
      options: {
        values: ["easy", "medium", "hard"]
      }
    },
    {
      name: "question",
      type: "text",
      required: true
    },
    {
      name: "answer_a",
      type: "text",
      required: true
    },
    {
      name: "answer_b",
      type: "text",
      required: true
    },
    {
      name: "answer_c",
      type: "text",
      required: true
    },
    {
      name: "answer_d",
      type: "text",
      required: true
    },
    {
      name: "level",
      type: "text",
      required: false
    },
    {
      name: "metadata",
      type: "text",
      required: false
    },
    {
      name: "imported_at",
      type: "autodate",
      required: true
    }
  ]
};

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

async function setupCollection() {
  try {
    console.log('🏗️  Setting up questions collection...');

    // Check if collection exists
    try {
      const existingCollection = await pb.collections.getOne('questions');
      console.log('📝 Questions collection already exists, updating schema...');

      // Update existing collection
      await pb.collections.update(existingCollection.id, questionsSchema);
      console.log('✅ Collection schema updated successfully');
    } catch (error) {
      if (error.status === 404) {
        // Create new collection
        console.log('📝 Creating new questions collection...');
        await pb.collections.create(questionsSchema);
        console.log('✅ Collection created successfully');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to setup collection:', error.message);
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
        question[header] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
      });

      // Validate required fields
      if (!question.id || !question.question || !question.a || !question.b || !question.c || !question.d) {
        console.warn(`⚠️  Line ${i + 1} has missing required fields, skipping...`);
        continue;
      }

      // Skip questions with empty category (subcategory can be empty)
      if (!question.category) {
        console.warn(`⚠️  Line ${i + 1} has empty category, skipping...`);
        continue;
      }

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

    const existingIds = new Set();
    let page = 1;
    const perPage = 1000;
    let hasMore = true;

    // Get existing external_ids in batches to avoid memory issues
    while (hasMore) {
      const records = await pb.collection('questions').getList(page, perPage, {
        fields: 'external_id',
        filter: 'external_id != ""'
      });

      records.items.forEach(record => {
        if (record.external_id) {
          existingIds.add(record.external_id);
        }
      });

      hasMore = records.totalPages > page;
      page++;

      // Progress indicator for large datasets
      if (page % 10 === 0) {
        console.log(`   Fetched ${existingIds.size} existing IDs...`);
      }
    }

    console.log(`📊 Found ${existingIds.size} existing questions in database`);

    return existingIds;
  } catch (error) {
    console.error('❌ Failed to get existing questions:', error.message);
    return new Set();
  }
}

async function importQuestions(questions, existingIds) {
  try {
    console.log('📥 Starting import process...');

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
        let success = false;
        let lastError = null;

        // Try up to 3 times, but with increasing delays
        for (let attempt = 1; attempt <= 3 && !success; attempt++) {
          try {
            // Clean and validate the data
            const recordData = {
              external_id: question.id.substring(0, 255), // Limit external_id length
              category: question.category ? question.category.substring(0, 255) : '',
              subcategory: question.subcategory ? question.subcategory.substring(0, 255) : 'General', // Use default value for empty subcategory
              difficulty: question.difficulty === 'easy' || question.difficulty === 'medium' || question.difficulty === 'hard' ? question.difficulty : 'medium',
              question: question.question ? question.question.substring(0, 2000) : '',
              answer_a: question.a ? question.a.substring(0, 500) : '',
              answer_b: question.b ? question.b.substring(0, 500) : '',
              answer_c: question.c ? question.c.substring(0, 500) : '',
              answer_d: question.d ? question.d.substring(0, 500) : '',
              level: question.level ? question.level.substring(0, 100) : '',
              metadata: question.metadata ? question.metadata.substring(0, 1000) : ''
            };

            await pb.collection('questions').create(recordData);
            batchResults.push({ success: true });
            success = true;
            break;
          } catch (error) {
            lastError = error;

            // If it's a duplicate error, don't retry
            if (error.status === 400 && error.data?.data?.external_id?.code === 'validation_not_unique') {
              batchResults.push({ success: false, reason: 'duplicate', questionId: question.id });
              break;
            }

            // Log detailed error information on final attempt
            if (attempt === 3) {
              console.error(`❌ Failed to import question ${question.id}:`);
              console.error(`   Status: ${error.status}`);
              console.error(`   Message: ${error.message}`);
              if (error.data) {
                console.error(`   Data:`, JSON.stringify(error.data, null, 2));
              }
              console.error(`   Record data:`, JSON.stringify(recordData, null, 2));
              batchResults.push({ success: false, reason: 'error', questionId: question.id, error: error.message });
            }

            // Wait before retry (except last attempt)
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 200 * attempt));
            }
          }
        }

        // Small delay between each request
        await new Promise(resolve => setTimeout(resolve, 20));
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
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`🎉 Import completed: ${imported} questions imported, ${skipped} skipped`);
    return { success: true, imported, skipped };
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return { success: false, imported: 0, skipped: 0, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting PocketBase questions import...\n');

  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    process.exit(1);
  }

  // Setup collection
  const collectionSuccess = await setupCollection();
  if (!collectionSuccess) {
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
    console.log('\n🎊 Import completed successfully!');
    console.log(`📈 Summary: ${result.imported} imported, ${result.skipped} skipped`);
  } else {
    console.error('\n💥 Import failed:', result.error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});