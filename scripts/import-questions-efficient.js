#!/usr/bin/env node

/**
 * Efficient questions import script based on the reference implementation
 * Uses direct REST API calls instead of PocketBase SDK for better performance
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password123'

/**
 * Authenticate with PocketBase and get admin token
 */
async function authenticate() {
	const response = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			identity: ADMIN_EMAIL,
			password: ADMIN_PASSWORD,
		}),
	})

	if (!response.ok) {
		throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
	}

	const data = await response.json()
	return data.token
}

/**
 * Parse a TSV line handling quoted fields
 */
function parseTsvLine(line) {
	const fields = []
	let current = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i++) {
		const char = line[i]
		const nextChar = line[i + 1]

		if (char === '"' && !inQuotes) {
			inQuotes = true
		} else if (char === '"' && inQuotes && nextChar !== '"') {
			inQuotes = false
		} else if (char === '"' && inQuotes && nextChar === '"') {
			current += '"'
			i++ // Skip next quote
		} else if (char === '\t' && !inQuotes) {
			fields.push(current)
			current = ''
		} else {
			current += char
		}
	}
	fields.push(current) // Add last field

	return fields
}

/**
 * Create a question record in PocketBase
 */
async function createQuestion(token, questionData) {
	const response = await fetch(`${POCKETBASE_URL}/api/collections/questions/records`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: token,
		},
		body: JSON.stringify(questionData),
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Failed to create question: ${response.status} ${error}`)
	}

	return await response.json()
}

/**
 * Get all existing external_ids to prevent duplicates
 */
async function getExistingExternalIds(token) {
	const existingIds = new Set()
	let page = 1
	const perPage = 1000
	let hasMore = true

	console.log('🔍 Getting existing question IDs to prevent duplicates...')

	while (hasMore) {
		const response = await fetch(`${POCKETBASE_URL}/api/collections/questions/records?page=${page}&perPage=${perPage}&fields=external_id`, {
			headers: {
				Authorization: token,
			},
		})

		if (!response.ok) {
			console.warn(`Warning: Could not fetch existing IDs page ${page}`)
			break
		}

		const data = await response.json()

		data.items.forEach(item => {
			if (item.external_id) {
				existingIds.add(item.external_id)
			}
		})

		hasMore = data.totalPages > page
		page++

		if (page % 10 === 0) {
			console.log(`   Fetched ${existingIds.size} existing IDs...`)
		}
	}

	console.log(`📊 Found ${existingIds.size} existing questions in database`)
	return existingIds
}

/**
 * Main function
 */
async function main() {
	try {
		console.log('🚀 Starting efficient questions import...')
		console.log('🔐 Authenticating with PocketBase...')
		const token = await authenticate()
		console.log('✅ Authenticated successfully')

		// Get existing external_ids to prevent duplicates
		const existingIds = await getExistingExternalIds(token)

		// Read TSV file
		const tsvPath = path.join(__dirname, '../questions.tsv')
		console.log(`📖 Reading questions from ${tsvPath}...`)
		const tsvContent = fs.readFileSync(tsvPath, 'utf-8')

		// Parse TSV (skip header row)
		const lines = tsvContent.trim().split('\n').slice(1)
		console.log(`📦 Found ${lines.length} questions in TSV`)

		// Filter out questions that already exist
		const newLines = lines.filter((line, index) => {
			if (!line.trim()) return false
			const fields = parseTsvLine(line)
			const id = fields[0]
			return id && !existingIds.has(id)
		})

		console.log(`📊 ${newLines.length} new questions to import (${lines.length - newLines.length} already exist)`)

		let successCount = 0
		let errorCount = 0
		let skippedCount = 0

		// Process each line
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			if (!line.trim()) continue

			const fields = parseTsvLine(line)

			// Handle lines with wrong number of fields
			if (fields.length < 11) {
				console.warn(`⚠️  Line ${i + 2} has insufficient fields, skipping...`)
				skippedCount++
				continue
			}

			const [id, category, subcategory, difficulty, question, a, b, c, d, level, metadata] = fields

			// Skip if already exists
			if (id && existingIds.has(id)) {
				skippedCount++
				continue
			}

			// Skip questions with empty required fields
			if (!question || !a || !b || !c || !d) {
				console.warn(`⚠️  Line ${i + 2} has missing required fields, skipping...`)
				skippedCount++
				continue
			}

			try {
				const questionData = {
					external_id: id, // Keep external_id for deduplication
					category: category || '',
					subcategory: subcategory || 'General', // Default for empty subcategory
					difficulty: difficulty || 'medium',
					question: question,
					answer_a: a,
					answer_b: b,
					answer_c: c,
					answer_d: d,
					level: level || '',
				}

				// Only add metadata if it's not empty
				if (metadata && metadata.trim()) {
					try {
						questionData.metadata = JSON.parse(metadata)
					} catch (e) {
						// If metadata is not valid JSON, store as string
						questionData.metadata = metadata
					}
				}

				await createQuestion(token, questionData)
				successCount++

				// Progress indicator
				if (successCount % 100 === 0) {
					console.log(`  ✓ Loaded ${successCount} questions...`)
				}
			} catch (error) {
				errorCount++
				console.error(`  ✗ Error loading question ${i + 2}: ${error.message}`)

				// Stop if too many errors
				if (errorCount > 10) {
					throw new Error('Too many errors, aborting import')
				}
			}
		}

		console.log(`\n✅ Import complete!`)
		console.log(`   Successfully loaded: ${successCount} questions`)
		console.log(`   Skipped: ${skippedCount} questions`)
		if (errorCount > 0) {
			console.log(`   Errors: ${errorCount}`)
		}
	} catch (error) {
		console.error(`\n❌ Error: ${error.message}`)
		process.exit(1)
	}
}

main()