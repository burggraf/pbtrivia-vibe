# PocketBase Database Entity Relationship Diagram (ERD)

## Overview
This document describes the database schema for the Trivia Party application, which is built on PocketBase. The database supports a multiplayer trivia game system with hosts, players, teams, games, rounds, questions, and game answers.

## Collections (Tables)

### 1. `_pb_users_auth_` (Users)
**Purpose**: Authentication and user management
**System Collection**: Yes (PocketBase built-in)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique user identifier |
| email | text | Unique, required | User's email address |
| verified | bool | - | Email verification status |
| tokenKey | text | - | Authentication token key |

---

### 2. `games`
**Purpose**: Main game sessions created by hosts

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique game identifier |
| host | relation → _pb_users_auth_ | Required | Game host/creator |
| name | text(255) | Required | Game display name |
| code | text(6) | Required, Unique | 6-character game code |
| startdate | date | Optional | Scheduled start date |
| duration | number(1-9999) | Optional | Game duration in minutes |
| location | text(500) | Optional | Physical/virtual location |
| status | select | Required | Game status: `setup`, `ready`, `in-progress`, `completed` |
| scoreboard | json | Optional | Real-time scoreboard data structure |
| data | json | Optional | Game state and configuration data |
| metadata | json | Optional | Game settings including timer configuration |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Game State Data Structure (`data` field)**:
```json
{
  "state": "game-start" | "round-start" | "round-play" | "round-end" | "game-end" | "thanks" | "return-to-lobby",
  "round": {
    "round_number": number,
    "rounds": number,
    "question_count": number,
    "title": string
  },
  "question": {
    "id": string,
    "question_number": number,
    "category": string,
    "question": string,
    "difficulty": string,
    "a": string,
    "b": string,
    "c": string,
    "d": string,
    "correct_answer": string,
    "submitted_answer": string
  }
}
```

**Scoreboard Data Structure (`scoreboard` field)**:
```json
{
  "teams": {
    "teamId": {
      "name": string,
      "players": [
        {
          "id": string,
          "name": string,
          "email": string
        }
      ],
      "score": number
    }
  }
}
```

**Metadata Structure (`metadata` field)**:
```json
{
  "question_timer": number | null,      // Timer for round-play state (seconds)
  "answer_timer": number | null,        // Timer for round-end state (seconds)
  "game_start_timer": number | null,    // Timer for game-start state (seconds)
  "round_start_timer": number | null,   // Timer for round-start state (seconds)
  "game_end_timer": number | null,      // Timer for game-end state (seconds)
  "thanks_timer": number | null         // Timer for thanks state (seconds)
}
```

**Indexes**:
- `idx_games_host` - For finding games by host
- `idx_games_startdate` - For chronological queries
- `idx_games_status` - For filtering by status
- `idx_games_code` - Unique game code lookup
- `idx_games_code_status` - Composite index for player joins (code + status lookup)
- `idx_games_host_startdate` - Composite index for host dashboard queries (host + startdate sorting)

**Cascade Deletes**: Enabled for host relation

---

### 3. `rounds`
**Purpose**: Individual rounds within games

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique round identifier |
| title | text(255) | Required | Round display title |
| question_count | number(1-100) | Required | Number of questions in round |
| categories | json | Required | Selected categories for round |
| sequence_number | number(1-9999) | Required | Order within game |
| game | relation → games | Required | Parent game |
| host | relation → _pb_users_auth_ | Required | Round creator |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Indexes**:
- `idx_rounds_game` - For rounds by game
- `idx_rounds_host` - For rounds by host
- `idx_rounds_sequence` - For ordering within game
- `idx_rounds_created` - For chronological queries

**Cascade Deletes**: Enabled for host and game relations

**Access Rules**: Only the round host can view, create, update, and delete their own rounds.

---

### 4. `questions`
**Purpose**: Trivia question bank (60K+ questions)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique question identifier |
| external_id | text(255) | Optional, Unique | Source system ID |
| category | text(255) | Required | Question category |
| subcategory | text(255) | Required | Question subcategory |
| difficulty | select | Required | Difficulty: `easy`, `medium`, `hard` |
| question | text(2000) | Required | Question text |
| answer_a | text(500) | Required | Multiple choice option A |
| answer_b | text(500) | Required | Multiple choice option B |
| answer_c | text(500) | Required | Multiple choice option C |
| answer_d | text(500) | Required | Multiple choice option D |
| level | text(100) | Optional | Difficulty level indicator |
| metadata | text(1000) | Optional | Additional metadata |
| imported_at | autodate | Auto | Import timestamp |

**Indexes**:
- `idx_questions_external_id` - Unique external ID lookup
- `idx_questions_category` - For category filtering
- `idx_questions_difficulty` - For difficulty filtering
- `idx_questions_imported_at` - For import tracking

---

### 5. `game_questions`
**Purpose**: Questions assigned to specific rounds (junction table)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique round question ID |
| host | relation → _pb_users_auth_ | Required | Assignment creator |
| game | relation → games | Required | Parent game |
| round | relation → rounds | Required | Parent round |
| question | relation → questions | Required | Question reference |
| sequence | number(0-9999) | Required | Order within round |
| category_name | text(255) | Required | Category name snapshot |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Indexes**:
- `idx_game_questions_host` - For host queries
- `idx_game_questions_game` - For game queries
- `idx_game_questions_round` - For round queries
- `idx_game_questions_question` - For question reference
- `idx_game_questions_sequence` - For ordering within round
- `idx_game_questions_host_game` - Composite host-game index
- `idx_game_questions_created` - For chronological queries

**Cascade Deletes**: Enabled for host, game, question, and round relations

**Access Rules**: Only the assignment creator can view, create, update, and delete their own game questions.

---

### 6. `game_teams`
**Purpose**: Teams participating in games

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique team identifier |
| host | relation → _pb_users_auth_ | Required | Team creator |
| game | relation → games | Required | Parent game |
| name | text(30) | Required | Team name |
| metadata | json | Optional | Team configuration data |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Indexes**:
- `idx_game_teams_game` - For fetching all teams in a game
- `idx_game_teams_host_game` - Composite index for host + game lookups

**Cascade Deletes**: Enabled for host and game relations

---

### 7. `game_players`
**Purpose**: Players assigned to teams in games

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique player assignment ID |
| host | relation → _pb_users_auth_ | Required | Assignment creator |
| game | relation → games | Required | Parent game |
| player | relation → _pb_users_auth_ | Required | Player user |
| team | relation → game_teams | Optional | Assigned team |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Indexes**:
- `idx_game_players_game_player` - Composite index for checking if player is already in game
- `idx_game_players_game` - For listing all players in a game

**Cascade Deletes**: Enabled for host, game, player, and team relations

---

### 8. `game_answers` (NEW)
**Purpose**: Team answers submitted during game rounds

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK, auto-generated | Unique answer identifier |
| host | relation → _pb_users_auth_ | Required | Answer creator |
| game | relation → games | Required | Parent game |
| game_questions_id | relation → game_questions | Required | Specific question reference |
| team | relation → game_teams | Required | Answering team |
| answer | text | Optional | Submitted answer (A, B, C, D) |
| is_correct | bool | Optional | Whether answer was correct |
| created | autodate | Auto | Creation timestamp |
| updated | autodate | Auto | Last update timestamp |

**Indexes**:
- `idx_game_answers_host` - For host queries
- `idx_game_answers_game` - For game queries
- `idx_game_answers_game_questions_id` - For question reference
- `idx_game_answers_team` - For team queries
- `idx_game_answers_created` - For chronological queries
- `idx_game_answers_game_team` - Composite index for scoring queries
- `idx_game_answers_game_question_team` - Composite index for answer submission validation
- `idx_game_answers_questions_team_unique` - **UNIQUE** on (`game_questions_id`, `team`) - prevents duplicate answers from same team for same question

**Cascade Deletes**: Enabled for host, game, game_questions_id, and team relations

**Business Rule**: Each team can only submit one answer per question due to the unique constraint on (`game_questions_id`, `team`).

---

## Relationship Diagram

```
_pb_users_auth_ (Users)
├─ host ──> games (1:N)
│          ├─ host ──> rounds (1:N)
│          │          └─ host ──> game_questions (1:N)
│          ├─ host ──> game_teams (1:N)
│          ├─ host ──> game_players (1:N)
│          └─ host ──> game_answers (1:N)
│
├─ host ──> rounds (1:N)
│          └─ round ──> game_questions (1:N)
│
├─ host ──> game_questions (1:N)
│          ├─ game ──> games (N:1)
│          ├─ round ──> rounds (N:1)
│          └─ question ──> questions (N:1)
│
├─ host ──> game_teams (1:N)
│          └─ game ──> games (N:1)
│
├─ host ──> game_players (1:N)
│          ├─ game ──> games (N:1)
│          ├─ player ──> _pb_users_auth_ (N:1) [self-reference]
│          └─ team ──> game_teams (N:1) [optional]
│
├─ host ──> game_answers (1:N)
│          ├─ game ──> games (N:1)
│          ├─ game_questions_id ──> game_questions (N:1)
│          └─ team ──> game_teams (N:1)
│
└─ player ──> game_players (1:N)
           └─ game ──> games (N:1)

questions (Standalone, no incoming relations)
└─ question ──> game_questions (1:N)

game_questions
└─ game_questions_id ──> game_answers (1:N)

game_teams
└─ team ──> game_players (N:1) [optional]
└─ team ──> game_answers (1:N)
```

## Relationship Summary

### Primary Relationships

1. **User → Games (1:N)**
   - A user can host multiple games
   - Each game has exactly one host

2. **Game → Rounds (1:N)**
   - A game can have multiple rounds
   - Each round belongs to exactly one game

3. **Round → Game_Questions (1:N)**
   - A round can have multiple questions assigned
   - Each game_question belongs to exactly one round

4. **Question → Game_Questions (1:N)**
   - A question can be assigned to multiple rounds
   - Each game_question references exactly one question

5. **Game → Game_Teams (1:N)**
   - A game can have multiple teams
   - Each team belongs to exactly one game

6. **Game → Game_Players (1:N)**
   - A game can have multiple player assignments
   - Each game_player belongs to exactly one game

7. **User → Game_Players (1:N)**
   - A user can be assigned as player in multiple games
   - Each game_player references exactly one user

8. **Game_Team → Game_Players (1:N)**
   - A team can have multiple players (optional relationship)
   - Each game_player can optionally reference a team

9. **Game_Question → Game_Answers (1:N)**
   - A game_question can have multiple answers from different teams
   - Each game_answer references exactly one game_question

10. **Game_Team → Game_Answers (1:N)**
    - A team can submit multiple answers
    - Each game_answer references exactly one team

### Junction Tables

- **game_questions**: Many-to-many relationship between rounds and questions
- **game_players**: Many-to-many relationship between games and users (as players)
- **game_answers**: Tracks team answers for specific questions in games

## Data Flow Patterns

1. **Game Creation Flow**:
   ```
   User (host) → Game → Round(s) → Game_Questions → Questions
   ```

2. **Team Management Flow**:
   ```
   User (host) → Game → Game_Teams → Game_Players
   ```

3. **Game Play Flow**:
   ```
   Game_Question → Game_Answers (from Teams)
   ```

4. **Scoreboard Updates**:
   ```
   Game_Answers → Game.scoreboard (real-time updates)
   ```

## Game State Management

The `games.data` JSON field stores the current game state and progresses through these states:

1. **game-start**: Welcome screen with game information
2. **round-start**: Round introduction with categories
3. **round-play**: Active question answering with answer submission
4. **round-end**: Round completion with current scores
5. **game-end**: Final results and winner announcement
6. **thanks**: Post-game thank you screen
7. **return-to-lobby**: Navigation back to host dashboard

## Access Control Patterns

- **Host-based Access**: Most collections use `host.id=@request.auth.id` rules, meaning only the creator can access their own records
- **Game-based Isolation**: Records are scoped by both host and game, ensuring data isolation between different games
- **Public Read Access**: Questions collection has permissive read rules for game functionality
- **Team-based Access**: Game answers are scoped by both host and team for security

## Performance Considerations

1. **Strategic Indexing**: All foreign key fields are indexed for optimal join performance
2. **Composite Indexes**: Important query patterns have composite indexes (e.g., host+game combinations)
3. **Unique Constraints**: Game codes and external question IDs have unique constraints for data integrity
4. **JSON Fields**: Categories, metadata, game state, and scoreboard data use JSON for flexible, semi-structured data storage
5. **Real-time Updates**: Scoreboard and game state updates leverage PocketBase's real-time subscription system

## Security Notes

- All user-accessible collections implement row-level security based on the `host` field
- Game codes are 6-character alphanumeric strings for secure game joining
- Player assignments are tracked with both host and player references for audit trails
- Answer submissions are tied to specific teams and questions for integrity
- Game state transitions are managed server-side to prevent unauthorized state changes

## Recent Updates

- **Collection renamed**: `round_questions` → `game_questions` for clearer semantics
- **Added `data` field to games collection**: Stores game state and configuration
- **Added `scoreboard` field to games collection**: Real-time scoreboard data structure
- **Added `metadata` field to games collection**: Stores timer configuration and other game settings
- **Created `game_answers` collection**: Tracks team answers during gameplay
- **Enhanced game state management**: Comprehensive state machine with 7 distinct states
- **Improved real-time functionality**: Live updates for scoreboard and game state changes
- **Added unique constraint to game_answers**: Prevents teams from submitting multiple answers to the same question (`game_questions_id` + `team` combination)
- **Added cascade deletes**: Enabled for all critical foreign key relationships to ensure data integrity
- **Added performance indexes**: Composite indexes added for optimizing player joins, game creation, and gameplay queries