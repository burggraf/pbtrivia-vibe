# Questions Import Script

This script imports trivia questions from `questions.tsv` into the PocketBase database.

## Features

- ✅ **Automatic schema setup** - Creates or updates the `questions` collection with proper field types
- ✅ **Duplicate prevention** - Checks for existing questions using their external_id to prevent duplicates
- ✅ **Batch processing** - Processes questions in batches of 100 for better performance
- ✅ **Error handling** - Handles import errors gracefully and provides detailed logging
- ✅ **Progress tracking** - Shows detailed progress during import

## Usage

### Prerequisites

1. Make sure PocketBase is running on `http://localhost:8090`
2. The default admin credentials should be:
   - Email: `admin@example.com`
   - Password: `Password123`

### Running the Import

```bash
# Using npm script (recommended)
npm run import-questions

# Or run directly
node scripts/import-questions.js
```

## Collection Schema

The script creates/updates a `questions` collection with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Text (system) | Yes | PocketBase auto-generated ID |
| `external_id` | Text (unique) | No | Original UUID from TSV file |
| `category` | Text | Yes | Question category (e.g., "History") |
| `subcategory` | Text | Yes | Question subcategory (e.g., "Ancient Civilizations") |
| `difficulty` | Select | Yes | Difficulty level: "easy", "medium", "hard" |
| `question` | Text | Yes | The trivia question text |
| `answer_a` | Text | Yes | Multiple choice option A |
| `answer_b` | Text | Yes | Multiple choice option B |
| `answer_c` | Text | Yes | Multiple choice option C |
| `answer_d` | Text | Yes | Multiple choice option D |
| `level` | Text | No | Additional level field (currently empty) |
| `metadata` | Text | No | Additional metadata (currently empty) |
| `imported_at` | Autodate | Yes | Timestamp when the record was imported |
| `created` | Autodate (system) | Yes | PocketBase creation timestamp |
| `updated` | Autodate (system) | Yes | PocketBase update timestamp |

## Duplicate Prevention

The script prevents duplicate imports by:

1. **Pre-check**: Fetches all existing `external_id` values from the database
2. **Filtering**: Only processes questions whose `external_id` is not already in the database
3. **Unique constraint**: The `external_id` field has a unique constraint at the database level

## Performance

- **Batch size**: Processes 100 questions at a time to balance performance and memory usage
- **Total questions**: ~61,000 questions
- **Estimated time**: 5-10 minutes depending on system performance
- **Memory usage**: Low memory footprint due to batch processing

## Configuration

You can modify these constants in `import-questions.js`:

```javascript
const POCKETBASE_URL = 'http://localhost:8090';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Password123';
const BATCH_SIZE = 100; // Adjust batch size if needed
```

## Troubleshooting

### Common Issues

1. **Authentication failed**
   - Check that PocketBase is running
   - Verify admin credentials are correct
   - Make sure you're logged into the admin panel at least once

2. **Collection already exists**
   - The script will automatically update the existing collection schema
   - This is normal and expected behavior

3. **Import fails partway through**
   - The script can be safely re-run
   - Duplicate prevention ensures no data corruption
   - Check the error messages for specific issues

4. **TSV file not found**
   - Make sure `questions.tsv` is in the project root directory
   - Check file permissions

### Logs

The script provides detailed logging with emojis for easy reading:
- 🚀 Script start
- 🔐 Authentication
- 🏗️ Collection setup
- 📖 File reading
- 🔍 Data checking
- 📦 Batch processing
- ✅ Success messages
- ❌ Error messages
- 🎉 Completion

## Data Integrity

- All string fields are properly trimmed of quotes
- Empty values are handled gracefully
- Required fields are validated before import
- The script maintains the original UUIDs in `external_id` for reference

## Example Output

```
🚀 Starting PocketBase questions import...

🔐 Authenticating with PocketBase...
✅ Authentication successful

🏗️  Setting up questions collection...
📝 Questions collection already exists, updating schema...
✅ Collection schema updated successfully

📖 Reading TSV file...
📊 Found 12 columns: id, category, subcategory, difficulty, question, a, b, c, d, level, metadata, created_at, updated_at
✅ Parsed 61257 questions from TSV

🔍 Checking for existing questions...
📊 Found 0 existing questions in database

📥 Starting import process...
📊 61257 new questions to import (0 already exist)
📦 Processing batch 1/613 (100 questions)...
✅ Batch 1 completed: 100 imported, 0 skipped
📦 Processing batch 2/613 (100 questions)...
✅ Batch 2 completed: 100 imported, 0 skipped
...

🎉 Import completed successfully!
📈 Summary: 61257 imported, 0 skipped

🎊 Import completed successfully!
```